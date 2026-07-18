import os

file_path = "src/App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

imports = """
import { PublicTestimonialForm } from './pages/PublicTestimonialForm';
import { PublicRecommendationForm } from './pages/PublicRecommendationForm';
"""

routes = """
        <Route path="/public/testimonial/:token" element={<PublicTestimonialForm />} />
        <Route path="/public/recommendation/:token" element={<PublicRecommendationForm />} />
"""

if "PublicTestimonialForm" not in content:
    content = content.replace("import { CareerInsightsPage } from './pages/CareerInsightsPage';", "import { CareerInsightsPage } from './pages/CareerInsightsPage';\n" + imports)
    content = content.replace("</Routes>", routes + "      </Routes>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added public routes to App.tsx")
