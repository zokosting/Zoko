const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuración ---
const GITHUB_REPO = "zokosting/Zoko"; 
// Si tiene que buscar dentro de una carpeta específica, indicarla aquí (ej. "enlaces/")
const REPO_PATH = ""; 
// Token de GitHub (puedes usar el GITHUB_TOKEN nativo de las Actions)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OUTPUT_FILE = 'random_url.json'; 

async function fetchRandomGitHubItem() {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
        console.error("Error: Faltan las variables de entorno GITHUB_TOKEN o GITHUB_REPO.");
        process.exit(1);
    }

    const apiURL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${REPO_PATH}`;
    console.log(`- Consultando contenido en el repositorio: ${GITHUB_REPO}...`);

    const response = await fetch(apiURL, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Node-Fetch'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la API de GitHub: ${response.status} - ${errorText}`);
    }

    const items = await response.json();
    
    // Filtrar: Solo archivos que terminen en .html y que NO sean index.html
    const htmlFiles = items.filter(item => 
        item.type === 'file' && 
        item.name.toLowerCase().endsWith('.html') && 
        item.name.toLowerCase() !== 'index.html'
    );

    console.log(`\nEncontrados ${htmlFiles.length} elementos válidos`);

    if (htmlFiles.length === 0) {
        throw new Error("No se encontraron elementos válidos en el repositorio para seleccionar.");
    }

    // Seleccionar uno aleatoriamente
    const randomIndex = Math.floor(Math.random() * htmlFiles.length);
    const randomItem = htmlFiles[randomIndex];

    // Construcción de la URL pública de GitHub Pages
    const pathPrefix = REPO_PATH ? `${REPO_PATH}/` : '';
    let targetUrl = `https://zokosting.github.io/Zoko/${pathPrefix}${randomItem.name}`;

    // Opcional: Si tus archivos dentro del repo contienen URLs de texto o quieres leer el contenido de un archivo .txt/.md:
    /*
    if (randomItem.name.endsWith('.txt') || randomItem.name.endsWith('.md')) {
        const contentRes = await fetch(randomItem.download_url);
        targetUrl = (await contentRes.text()).trim();
    }
    */

    // Crear el objeto JSON de salida
    const outputData = {
        url: targetUrl,
        title: randomItem.name,
        timestamp: new Date().toISOString()
    };

    // Guardar en el archivo estático
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
    
    console.log(`\n✅ URL aleatoria guardada en ${OUTPUT_FILE}: ${targetUrl}`);
}

fetchRandomGitHubItem().catch(err => {
    console.error(`\n❌ Proceso fallido:`, err.message);
    process.exit(1);
});