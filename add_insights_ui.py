import os

file_path = "src/pages/CareerInsightsPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will add a new Card for Tailoring Effectiveness
tailoring_ui = """
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Tailoring Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.tailoringEffectiveness ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-md bg-muted/20">
                  <h4 className="font-semibold mb-2">Tailored Applications</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Total sent:</span>
                    <span className="font-medium">{insights.tailoringEffectiveness.tailored.total}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Interviews/Offers:</span>
                    <span className="font-medium text-green-600">{insights.tailoringEffectiveness.tailored.interviewed}</span>
                  </div>
                  <div className="mt-4 text-2xl font-bold text-primary">
                    {insights.tailoringEffectiveness.tailored.rate.toFixed(1)}% <span className="text-sm font-normal text-muted-foreground">Success Rate</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md bg-muted/20">
                  <h4 className="font-semibold mb-2">Untailored Applications</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Total sent:</span>
                    <span className="font-medium">{insights.tailoringEffectiveness.untailored.total}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Interviews/Offers:</span>
                    <span className="font-medium text-green-600">{insights.tailoringEffectiveness.untailored.interviewed}</span>
                  </div>
                  <div className="mt-4 text-2xl font-bold text-muted-foreground">
                    {insights.tailoringEffectiveness.untailored.rate.toFixed(1)}% <span className="text-sm font-normal">Success Rate</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Not enough data to calculate tailoring effectiveness yet.</p>
            )}
          </CardContent>
        </Card>
"""

# Import Target
content = content.replace("LineChart, Search, Sparkles", "LineChart, Search, Sparkles, Target")

# Insert before </div></div> at the end
content = content.replace("</div>\n    </div>\n  );\n};\n\nexport default CareerInsightsPage;", tailoring_ui + "\n      </div>\n    </div>\n  );\n};\n\nexport default CareerInsightsPage;")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Tailoring Effectiveness to CareerInsightsPage")
