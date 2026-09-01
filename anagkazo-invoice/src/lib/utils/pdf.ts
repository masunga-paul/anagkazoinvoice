import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { InvoiceFormData } from '$lib/types/invoice';

/**
 * Downloads the EXACT preview invoice element as a high-resolution, single-page PDF directly into the user's device.
 * The page height dynamically adapts to contain all invoice details on exactly one single page.
 */
export async function downloadInvoicePDF(
	formDataOrElementId: InvoiceFormData | string = 'invoice-printable-area',
	customFilename?: string
): Promise<boolean> {
	if (typeof window === 'undefined') return false;

	const elementId = typeof formDataOrElementId === 'string' ? formDataOrElementId : 'invoice-printable-area';
	const element = document.getElementById(elementId);

	if (!element) {
		console.error(`[PDF Export] Element #${elementId} not found in DOM`);
		return false;
	}

	let invoiceNumber = 'INV-2026';
	if (typeof formDataOrElementId === 'object' && formDataOrElementId?.invoiceNumber) {
		invoiceNumber = formDataOrElementId.invoiceNumber;
	} else {
		const match = element.innerText.match(/#?(INV-[\w-]+)/i);
		if (match) invoiceNumber = match[1];
	}

	const filename = customFilename || `Invoice-${invoiceNumber}.pdf`;
	const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

	try {
		// 1. Capture exact preview element using native browser SVG/canvas engine
		const imgData = await toPng(element, {
			quality: 0.98,
			pixelRatio: 2.5,
			backgroundColor: '#ffffff',
			cacheBust: true,
			style: {
				boxShadow: 'none',
				borderRadius: '0px'
			}
		});

		// 2. Compute exact image aspect ratio
		const img = new Image();
		img.src = imgData;
		await new Promise((resolve) => {
			img.onload = resolve;
			img.onerror = resolve;
		});

		const pageWidth = 210; // Standard A4 width in mm
		const marginX = 8;
		const marginY = 8;
		const printableWidth = pageWidth - (marginX * 2); // 194 mm

		const imgWidth = img.naturalWidth || element.scrollWidth || 600;
		const imgHeight = img.naturalHeight || element.scrollHeight || 800;
		const contentHeightInMm = (imgHeight * printableWidth) / imgWidth;

		// Dynamically extend page length to ensure 100% of all invoice details fit on ONE single page
		const dynamicPageHeight = Math.max(297, contentHeightInMm + (marginY * 2));

		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: [pageWidth, dynamicPageHeight]
		});

		// Render the full invoice on a single continuous page
		pdf.addImage(imgData, 'PNG', marginX, marginY, printableWidth, contentHeightInMm, undefined, 'FAST');

		// 3. Save PDF file directly to user's device
		pdf.save(safeFilename);
		return true;
	} catch (err) {
		console.error('[PDF Export] toPng error during single-page PDF generation:', err);
		return false;
	}
}
