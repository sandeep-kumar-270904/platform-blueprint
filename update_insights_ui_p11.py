import os

insights_path = "src/pages/CareerInsightsPage.tsx"
with open(insights_path, "r", encoding="utf-8") as f:
    content = f.read()

rejection_insights = """
  const [rejectionInsights, setRejectionInsights] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications/insights/rejections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setRejectionInsights(data))
      .catch(console.error);
    }
  }, [token]);
"""

if "setRejectionInsights" not in content:
    content = content.replace("useEffect(() => {", rejection_insights + "\n  useEffect(() => {")

    insights_ui = """
      {rejectionInsights.length > 0 && (
        <Card className="mt-6 border-red-200 dark:border-red-900/50">
          <CardHeader className="bg-red-50/50 dark:bg-red-900/10">
            <CardTitle>Application Insights: Rejection Feedback</CardTitle>
            <CardDescription>Aggregate themes from your past applications to help you improve.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {rejectionInsights.map((insight: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <span className="capitalize font-medium">{insight.feedback.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">{insight.count} rejections cited this</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
"""
    content = content.replace("<CareerSimulator resumeId={resumeId as string} />", "<CareerSimulator resumeId={resumeId as string} />\n" + insights_ui)
    with open(insights_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated CareerInsightsPage.tsx")

