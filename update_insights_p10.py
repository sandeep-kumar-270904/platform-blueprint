import os

file_path = "src/pages/CareerInsightsPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

benchmark_fetch = """
  const [benchmark, setBenchmark] = useState<any>(null);

  useEffect(() => {
    if (token) {
      // Mocking target role for demo
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/insights/benchmark?role=developer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setBenchmark(data))
      .catch(console.error);
    }
  }, [token]);
"""
if "const [benchmark" not in content:
    content = content.replace("useEffect(() => {", benchmark_fetch + "\n  useEffect(() => {")

benchmark_ui = """
      {benchmark?.available && (
        <Card className="mt-6 border-blue-200 dark:border-blue-900/50">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10">
            <CardTitle>Industry Benchmark</CardTitle>
            <CardDescription>How your resume compares to others in your target role</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="text-2xl font-bold">{data.currentScore || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Industry Average</p>
                <p className="text-2xl font-bold text-blue-600">{benchmark.averageScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
"""
if "Industry Benchmark" not in content:
    content = content.replace("<CareerSimulator resumeId={resumeId as string} />", "<CareerSimulator resumeId={resumeId as string} />\n" + benchmark_ui)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated CareerInsightsPage.tsx for Phase 10")
