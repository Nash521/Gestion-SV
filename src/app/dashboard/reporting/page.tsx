import { ReportGenerator } from '@/components/reporting/report-generator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportingPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
        <CardHeader>
          <CardTitle>Assistant de Reporting IA</CardTitle>
          <CardDescription>
            Posez une question sur vos finances en langage naturel, et notre IA générera un rapport pour vous.
            Essayez de demander "Quel a été mon revenu total ?" ou "Combien ai-je de factures en retard ?".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
