'use server';
/**
 * @fileOverview An AI agent that analyzes business data to provide recommendations for offer strategy.
 *
 * - analyzeOfferStrategy - A function that handles the analysis process and provides recommendations.
 * - AnalyzeOfferStrategyInput - The input type for the analyzeOfferStrategy function.
 * - AnalyzeOfferStrategyOutput - The return type for the analyzeOfferStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schemas for individual data types
const StockEntrySchema = z.object({
  productId: z.string().describe('ID of the product.'),
  supplierId: z.string().describe('ID of the supplier.'),
  quantity: z.number().int().positive().describe('Current quantity in stock.'),
  price: z.number().positive().describe('Price of the stock item.'),
  leadTime: z.number().int().min(0).describe('Lead time in days for this stock.'),
});

const CustomerResponseEntrySchema = z.object({
  customerId: z.string().describe('ID of the customer.'),
  bestOfferId: z.string().describe('ID of the best offer related to this response.'),
  responseType: z.enum(['order', 'quote', 'interest']).describe('Type of customer response.'),
  createdAt: z.string().describe('Timestamp when the response was created.'),
});

const BestOfferEntrySchema = z.object({
  bestOfferId: z.string().describe('ID of the best offer.'),
  productId: z.string().describe('ID of the product for this offer.'),
  supplierId: z.string().describe('ID of the supplier for this offer.'),
  bestPrice: z.number().positive().describe('The best price offered.'),
  leadTime: z.number().int().min(0).describe('Lead time in days for this offer.'),
  calculatedAt: z.string().describe('Timestamp when this offer was calculated.'),
});

const SupplierDetailSchema = z.object({
  id: z.string().describe('Unique ID of the supplier.'),
  name: z.string().describe('Name of the supplier.'),
  country: z.string().describe('Country of the supplier.'),
  productsOffered: z.array(z.string()).describe('List of products offered by the supplier.'),
});

const ProductDetailSchema = z.object({
  id: z.string().describe('Unique ID of the product.'),
  name: z.string().describe('Name of the product.'),
  category: z.string().describe('Category of the product.'),
});

// Main Input Schema for the flow
const AnalyzeOfferStrategyInputSchema = z.object({
  currentStocks: z.array(StockEntrySchema).describe('List of current inventory stock entries.'),
  recentCustomerResponses: z.array(CustomerResponseEntrySchema).describe('List of recent customer responses to offers.'),
  currentBestOffers: z.array(BestOfferEntrySchema).describe('List of current best offers available.'),
  supplierDetails: z.array(SupplierDetailSchema).describe('Details of relevant suppliers.'),
  productDetails: z.array(ProductDetailSchema).describe('Details of relevant products.'),
});
export type AnalyzeOfferStrategyInput = z.infer<typeof AnalyzeOfferStrategyInputSchema>;

// Output Schema for the flow
const AnalyzeOfferStrategyOutputSchema = z.object({
  recalculationTimingRecommendation: z.string().describe('Recommendation on the optimal timing to trigger offer recalculations, explaining the rationale.'),
  strategicAdjustments: z.array(z.string()).describe('A list of specific strategic adjustments to maximize conversion rates and profitability.'),
  conversionRateImpact: z.string().describe('An assessment of the potential impact on the overall conversion rate if recommendations are implemented.'),
  profitabilityImpact: z.string().describe('An assessment of the potential impact on profitability if recommendations are implemented.'),
});
export type AnalyzeOfferStrategyOutput = z.infer<typeof AnalyzeOfferStrategyOutputSchema>;

// Genkit Prompt definition
const offerStrategyPrompt = ai.definePrompt({
  name: 'offerStrategyPrompt',
  // The prompt input is stringified JSON for better LLM parsing of complex data
  input: {
    schema: z.object({
      currentStocksJson: z.string().describe('JSON string of current inventory stock entries.'),
      recentCustomerResponsesJson: z.string().describe('JSON string of recent customer responses.'),
      currentBestOffersJson: z.string().describe('JSON string of current best offers.'),
      supplierDetailsJson: z.string().describe('JSON string of relevant supplier details.'),
      productDetailsJson: z.string().describe('JSON string of relevant product details.'),
    }),
  },
  output: { schema: AnalyzeOfferStrategyOutputSchema },
  prompt: `You are an expert business strategist for a business management system. Your goal is to analyze real-time business data and provide actionable recommendations to optimize offers, maximize conversion rates, and improve profitability.

Analyze the following data:

**Current Inventory Stocks:**
{{{currentStocksJson}}}

**Current Best Offers:**
{{{currentBestOffersJson}}}

**Recent Customer Responses:**
{{{recentCustomerResponsesJson}}}

**Supplier Information:**
{{{supplierDetailsJson}}}

**Product Information:**
{{{productDetailsJson}}}

Based on this comprehensive data, provide the following recommendations in a structured JSON format:

1.  **Optimal Timing for Offer Recalculations:** When should offers be recalculated? Consider stock levels (e.g., low stock for a popular item might warrant a price adjustment or offer change), supplier lead times (long lead times might require earlier recalculation), and recent customer interest patterns from responses (e.g., high "interest" for a specific product). Explain the rationale for your timing recommendation.
2.  **Strategic Adjustments:** Suggest specific strategic changes to maximize conversion and profitability. This could involve adjusting pricing strategies for certain products, targeting specific customer segments with tailored offers, modifying product bundling, or negotiating better terms with specific suppliers based on their performance or product demand. Provide concrete suggestions.
3.  **Potential Conversion Rate Impact:** Describe how implementing these recommendations might affect the overall conversion rate, providing a qualitative assessment.
4.  **Potential Profitability Impact:** Describe how implementing these recommendations might affect overall profitability, providing a qualitative assessment.`,
});

// Genkit Flow definition
const analyzeOfferStrategyFlow = ai.defineFlow(
  {
    name: 'analyzeOfferStrategyFlow',
    inputSchema: AnalyzeOfferStrategyInputSchema, // The flow's input is the structured object
    outputSchema: AnalyzeOfferStrategyOutputSchema,
  },
  async (input) => {
    // Stringify complex objects here before passing to the prompt to ensure correct LLM parsing
    const promptInput = {
      currentStocksJson: JSON.stringify(input.currentStocks, null, 2),
      recentCustomerResponsesJson: JSON.stringify(input.recentCustomerResponses, null, 2),
      currentBestOffersJson: JSON.stringify(input.currentBestOffers, null, 2),
      supplierDetailsJson: JSON.stringify(input.supplierDetails, null, 2),
      productDetailsJson: JSON.stringify(input.productDetails, null, 2),
    };
    const { output } = await offerStrategyPrompt(promptInput);
    return output!;
  }
);

// Wrapper function for the flow, to be called from Next.js components
export async function analyzeOfferStrategy(input: AnalyzeOfferStrategyInput): Promise<AnalyzeOfferStrategyOutput> {
  return analyzeOfferStrategyFlow(input);
}
