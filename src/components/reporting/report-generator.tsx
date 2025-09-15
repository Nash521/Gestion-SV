"use client";

import React, { useState, useTransition } from 'react';
import { accountingReportFromNaturalLanguage } from '@/ai/flows/accounting-report-from-natural-language';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, Terminal } from 'lucide-react';

export function ReportGenerator() {
  const [question, setQuestion] = useState('');
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReport('');

    if (!question) {
      setError('Veuillez poser une question.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await accountingReportFromNaturalLanguage({ question });
        if (result.report) {
          setReport(result.report);
        } else {
          setError('Impossible de générer un rapport pour cette question.');
        }
      } catch (err) {
        console.error(err);
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="ex: Quel est mon revenu total et mes dépenses ?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Générer le rapport
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isPending && (
         <div className="flex items-center justify-center p-8 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Génération du rapport...</span>
            </div>
         </div>
      )}

      {report && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Rapport Généré
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-foreground">{report}</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
