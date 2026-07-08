const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');

async function extractImages() {
    try {
        const data = new Uint8Array(fs.readFileSync('Portfolio_Reference_Screens.pdf'));
        const loadingTask = pdfjsLib.getDocument({data: data});
        const pdfDocument = await loadingTask.promise;
        
        console.log('PDF loaded, pages: ' + pdfDocument.numPages);
        
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const buffer = canvas.toBuffer('image/jpeg');
            fs.writeFileSync(`images/page_${pageNum}.jpg`, buffer);
            console.log(`Saved images/page_${pageNum}.jpg`);
        }
    } catch (e) {
        console.error(e);
    }
}

extractImages();
