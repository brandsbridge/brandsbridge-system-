
'use server';
/**
 * @fileOverview An AI agent that scans invoice documents and extracts structured financial data.
 *
 * - scanInvoice - A function that handles the scanning process.
 * - ScanInvoiceInput - The input type for the scanInvoice function.
 * - ScanInvoiceOutput - The return type for the scanInvoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']).describe('Confidence level of the extraction.');

const ExtractedFieldSchema = z.object({
  value: z.string().nullable().describe('The extracted value.'),
  confidence: ConfidenceLevelSchema,
});

const ExtractedNumberFieldSchema = z.object({
  value: z.number().nullable().describe('The extracted numeric value.'),
  confidence: ConfidenceLevelSchema,
});

const ExtractedLineItemSchema = z.object({
  description: z.string().describe('Product or service description.'),
  quantity: z.number().describe('Quantity.'),
  unitPrice: z.number().describe('Unit price.'),
  total: z.number().describe('Line item total.'),
  confidence: ConfidenceLevelSchema,
});

const ScanInvoiceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanInvoiceInput = z.infer<typeof ScanInvoiceInputSchema>;

const ScanInvoiceOutputSchema = z.object({
  vendor: z.object({
    name: ExtractedFieldSchema,
    address: ExtractedFieldSchema.optional(),
  }),
  invoiceNumber: ExtractedFieldSchema,
  date: ExtractedFieldSchema,
  dueDate: ExtractedFieldSchema,
  currency: ExtractedFieldSchema,
  lineItems: z.array(ExtractedLineItemSchema),
  subtotal: ExtractedNumberFieldSchema,
  taxAmount: ExtractedNumberFieldSchema,
  total: ExtractedNumberFieldSchema,
  paymentTerms: ExtractedFieldSchema.optional(),
  overallConfidence: z.number().describe('Overall confidence score from 0 to 1.'),
});
export type ScanInvoiceOutput = z.infer<typeof ScanInvoiceOutputSchema>;

export async function scanInvoice(input: ScanInvoiceInput): Promise<ScanInvoiceOutput> {
  return scanInvoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanInvoicePrompt',
  input: {schema: ScanInvoiceInputSchema},
  output: {schema: ScanInvoiceOutputSchema},
  prompt: `You are an expert financial auditor specializing in OCR and invoice data extraction.

Examine the provided invoice image and extract all relevant financial fields. 

For each field, assign a confidence level:
- 'high': You are certain the data is correct.
- 'medium': There is some ambiguity or the text is slightly blurry but readable.
- 'low': The text is very difficult to read or you are making an educated guess.

Invoice Image: {{media url=photoDataUri}}

Extract:
1. Vendor/Supplier Name and Address.
2. Invoice Number.
3. Date and Due Date.
4. Currency (e.g., USD, AED, EUR).
5. Line Items: description, quantity, unit price, and total.
6. Subtotal, Tax Amount, and Final Total.
7. Payment Terms if visible.

Ensure all numeric values are numbers, not strings.`,
});

const scanInvoiceFlow = ai.defineFlow(
  {
    name: 'scanInvoiceFlow',
    inputSchema: ScanInvoiceInputSchema,
    outputSchema: ScanInvoiceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
