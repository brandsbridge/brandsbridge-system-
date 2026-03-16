
'use server';
/**
 * @fileOverview Enhanced AI agent for professional export invoice scanning.
 * Extracts GTINs, logistic details, and line items with high precision.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);

const ExtractedFieldSchema = z.object({
  value: z.string().nullable(),
  confidence: ConfidenceLevelSchema,
});

const ExtractedLineItemSchema = z.object({
  gtin: z.string().describe('GTIN-13 barcode'),
  description: z.string().describe('Full product description'),
  packing: z.number().describe('pcs per case'),
  quantityCs: z.number().describe('cases'),
  quantityPcs: z.number().describe('total pieces'),
  priceNet: z.number().describe('unit price'),
  total: z.number().describe('line total'),
  confidence: ConfidenceLevelSchema,
});

const ScanInvoiceInputSchema = z.object({
  photoDataUri: z.string()
});

const ScanInvoiceOutputSchema = z.object({
  header: z.object({
    invoiceNumber: ExtractedFieldSchema,
    type: z.string(),
    dateIssue: ExtractedFieldSchema,
    dateSale: ExtractedFieldSchema.optional()
  }),
  entities: z.object({
    sellerName: ExtractedFieldSchema,
    buyerName: ExtractedFieldSchema,
    recipientName: ExtractedFieldSchema
  }),
  logistics: z.object({
    deliveryTerms: ExtractedFieldSchema,
    containerNumber: ExtractedFieldSchema,
    truckNumber: ExtractedFieldSchema,
    totalWeightGross: z.number()
  }),
  lineItems: z.array(ExtractedLineItemSchema),
  totals: z.object({
    netAmount: z.number(),
    vatAmount: z.number(),
    grossAmount: z.number()
  }),
  overallConfidence: z.number()
});

export type ScanInvoiceOutput = z.infer<typeof ScanInvoiceOutputSchema>;

export async function scanInvoice(input: { photoDataUri: string }): Promise<ScanInvoiceOutput> {
  return scanInvoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanInvoicePrompt',
  input: {schema: ScanInvoiceInputSchema},
  output: {schema: ScanInvoiceOutputSchema},
  prompt: `You are an expert global trade auditor. Scan this EXPORT INVOICE and extract data with 100% precision.
  
  Focus areas:
  1. Header: Extract number (e.g. FSE-EXP/00000099/10/2025).
  2. Entities: Split Buyer and Recipient if they are in different columns.
  3. Logistics: Find Container # and Truck #.
  4. Line Items: CRITICAL - Extract the 13-digit GTIN barcode for every row.
  5. Totals: Capture Net, VAT, and Gross USD.

  Image: {{media url=photoDataUri}}`,
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
