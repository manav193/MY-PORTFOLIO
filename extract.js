import { exportImages } from 'pdf-export-images';
import path from 'path';

exportImages('Portfolio_Reference_Screens.pdf', 'images/pdf_extract')
  .then(images => console.log('Exported', images.length, 'images'))
  .catch(console.error);
