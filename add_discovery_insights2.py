import os

file_path = "src/pages/CareerInsightsPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add discoveryViews UI
discovery_ui = """
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Employer Discovery Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.discoveryViews || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Recruiters viewing your profile</p>
            </CardContent>
          </Card>
"""

if "Employer Discovery Views" not in content:
    content = content.replace("</CardContent>\n          </Card>\n        </div>", "</CardContent>\n          </Card>\n" + discovery_ui + "\n        </div>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added discoveryViews to CareerInsightsPage.tsx")
