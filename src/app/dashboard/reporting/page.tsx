import { ReportGenerator } from '@/components/reporting/report-generator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportingPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>AI Reporting Assistant</CardTitle>
          <CardDescription>
            Ask a question about your finances in plain language, and our AI will generate a report for you.
            Try asking "What was my total revenue?" or "How much do I have in overdue invoices?".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
