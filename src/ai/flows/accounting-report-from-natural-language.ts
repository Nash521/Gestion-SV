'use server';
/**
 * @fileOverview An accounting report generator that answers natural language questions.
 *
 * - accountingReportFromNaturalLanguage - A function that generates an accounting report from a natural language question.
 * - AccountingReportFromNaturalLanguageInput - The input type for the accountingReportFromNaturalLanguage function.
 * - AccountingReportFromNaturalLanguageOutput - The return type for the accountingReportFromNaturalLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AccountingReportFromNaturalLanguageInputSchema = z.object({
  question: z.string().describe('The natural language question about accounting data.'),
});
export type AccountingReportFromNaturalLanguageInput = z.infer<typeof AccountingReportFromNaturalLanguageInputSchema>;

const AccountingReportFromNaturalLanguageOutputSchema = z.object({
  report: z.string().describe('The AI-generated accounting report.'),
});
export type AccountingReportFromNaturalLanguageOutput = z.infer<typeof AccountingReportFromNaturalLanguageOutputSchema>;

export async function accountingReportFromNaturalLanguage(input: AccountingReportFromNaturalLanguageInput): Promise<AccountingReportFromNaturalLanguageOutput> {
  return accountingReportFromNaturalLanguageFlow(input);
}

const accountingDataSchema = z.object({
  revenue: z.number().describe('Total revenue.'),
  expenses: z.number().describe('Total expenses.'),
  overdueInvoices: z.number().describe('Total amount of overdue invoices.'),
});

const getAccountingData = ai.defineTool({
  name: 'getAccountingData',
  description: 'Returns accounting data from available categories.',
  inputSchema: z.object({
    categories: z.array(z.enum(['revenue', 'expenses', 'overdueInvoices'])).describe('The categories of accounting data to retrieve.'),
  }),
  outputSchema: accountingDataSchema,
}, async (input) => {
  // TODO: Implement the actual data retrieval logic here
  // This is a placeholder. Replace with actual database/service calls.
  const data: any = {};
  input.categories.forEach(category => {
    data[category] = Math.floor(Math.random() * 10000); // Mock data
  });
  return data as any;
});

const prompt = ai.definePrompt({
  name: 'accountingReportPrompt',
  tools: [getAccountingData],
  input: {schema: AccountingReportFromNaturalLanguageInputSchema},
  output: {schema: AccountingReportFromNaturalLanguageOutputSchema},
  prompt: `You are an AI accounting assistant. Use the available tools to answer the user's question about their financial situation.  Be concise in your answer.

Question: {{{question}}}`,
  system: `If the user asks a question that requires access to accounting data, use the getAccountingData tool to retrieve the relevant information. The getAccountingData tool accepts a list of categories for which it will return values. Available categories are revenue, expenses, and overdueInvoices. Do not ask the user for clarification; use the tool, and if the tool does not provide enough information to answer the question, respond that you do not have enough information.`
});

const accountingReportFromNaturalLanguageFlow = ai.defineFlow(
  {
    name: 'accountingReportFromNaturalLanguageFlow',
    inputSchema: AccountingReportFromNaturalLanguageInputSchema,
    outputSchema: AccountingReportFromNaturalLanguageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
