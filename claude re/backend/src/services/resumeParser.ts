import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Disable worker for Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export const extractTextFromBuffer = async (buffer: Buffer, mimetype: string): Promise<string> => {
  if (mimetype === 'application/pdf') {
    try {
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const textParts: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        textParts.push(pageText);
      }

      const text = textParts.join('\n').trim();

      if (!text || text.length < 50) {
        throw new Error('Could not extract readable text from PDF. Please ensure the PDF contains selectable text and is not scanned/image-based.');
      }

      return text;
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value || result.value.trim().length < 50) {
        throw new Error('Could not extract readable text from DOCX file.');
      }
      return result.value.trim();
    } catch (error: any) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
};

export const validateResumeText = (text: string): void => {
  if (!text || text.trim().length === 0) {
    throw new Error('The uploaded file appears to be empty.');
  }
  if (text.trim().length < 100) {
    throw new Error('The resume content is too short. Please upload a complete resume.');
  }
  if (text.trim().length > 50000) {
    throw new Error('The resume is too large to process. Please reduce the content.');
  }
};
