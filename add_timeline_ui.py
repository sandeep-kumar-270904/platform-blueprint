import os

file_path = "src/pages/PublicPortfolioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Import Timeline
if "AchievementTimeline" not in content:
    content = content.replace("import { Card, CardContent } from '@/components/ui/card';", "import { Card, CardContent } from '@/components/ui/card';\nimport { AchievementTimeline } from '@/components/portfolio/AchievementTimeline';")

# Add Timeline UI
timeline_ui = """
        <div className="mt-12">
          <AchievementTimeline portfolioSlug={slug as string} />
        </div>
"""

content = content.replace("</Card>\n          </div>\n        )}", "</Card>\n          </div>\n        )}\n" + timeline_ui)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added AchievementTimeline to PublicPortfolioPage.tsx")
