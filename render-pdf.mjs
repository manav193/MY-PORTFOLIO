import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import canvas from 'canvas';

async function extractImages() {
    try {
        const data = new Uint8Array(fs.readFileSync('Portfolio_Reference_Screens.pdf'));
        // Set standard font data url for pdfjs
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';
        
        const loadingTask = pdfjsLib.getDocument({
            data: data,
            standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
        });
        const pdfDocument = await loadingTask.promise;
        
        console.log('PDF loaded, pages: ' + pdfDocument.numPages);
        
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const cvs = canvas.createCanvas(viewport.width, viewport.height);
            const context = cvs.getContext('2d');
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const buffer = cvs.toBuffer('image/jpeg');
            fs.writeFileSync(`images/page_${pageNum}.jpg`, buffer);
            console.log(`Saved images/page_${pageNum}.jpg`);
        }
    } catch (e) {
        console.error(e);
    }
}

extractImages();
