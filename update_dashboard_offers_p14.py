import os

dashboard_path = "src/pages/ResumeDashboard.tsx"
with open(dashboard_path, "r", encoding="utf-8") as f:
    content = f.read()

offer_state = """
  const [showOfferCompare, setShowOfferCompare] = useState(false);
"""

if "showOfferCompare" not in content:
    content = content.replace("const [reflectionNotification, setReflectionNotification] = useState<any>(null);", "const [reflectionNotification, setReflectionNotification] = useState<any>(null);\n  const [showOfferCompare, setShowOfferCompare] = useState(false);")
    
    content = content.replace(
        "import AnnualReflectionModal from '../components/resume/AnnualReflectionModal';",
        "import AnnualReflectionModal from '../components/resume/AnnualReflectionModal';\nimport OfferComparisonModal from '../components/resume/OfferComparisonModal';"
    )

    offer_button = """
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            <p className="text-muted-foreground mt-1">Create, manage, and track your job applications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowOfferCompare(true)}>Compare Offers</Button>
            <Button onClick={handleCreateNew}>+ Create New</Button>
          </div>
        </div>
"""
    # Replace the header row
    import re
    content = re.sub(
        r'<div className="flex justify-between items-end mb-6">.*?<Button onClick=\{handleCreateNew\}>\+ Create New</Button>\s*</div>\s*</div>',
        offer_button.strip(),
        content,
        flags=re.DOTALL
    )

    # Insert the modal at the end before `</>`
    content = content.replace(
        "{reflectionNotification && <AnnualReflectionModal notification={reflectionNotification} onClose={handleDismissReflection} />}",
        "{reflectionNotification && <AnnualReflectionModal notification={reflectionNotification} onClose={handleDismissReflection} />}\n      {showOfferCompare && <OfferComparisonModal onClose={() => setShowOfferCompare(false)} />}"
    )

    with open(dashboard_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated ResumeDashboard.tsx with Offer Comparison Button")
