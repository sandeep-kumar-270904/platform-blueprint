import os

dashboard_path = "src/pages/ResumeDashboard.tsx"
with open(dashboard_path, "r", encoding="utf-8") as f:
    content = f.read()

reflection_logic = """
  const [reflectionNotification, setReflectionNotification] = useState<any>(null);

  useEffect(() => {
    // Fetch notifications to see if there's an annual reflection
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const reflection = data.find((n: any) => n.type === 'annual_reflection' && !n.isRead);
        if (reflection) setReflectionNotification(reflection);
      })
      .catch(console.error);
    }
  }, [token]);

  const handleDismissReflection = async () => {
    if (reflectionNotification) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/${reflectionNotification._id}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
      setReflectionNotification(null);
    }
  };
"""

if "setReflectionNotification" not in content:
    content = content.replace("useEffect(() => {", reflection_logic + "\n  useEffect(() => {")
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport AnnualReflectionModal from '../components/resume/AnnualReflectionModal';"
    )
    content = content.replace(
        "return (",
        "return (\n    <>\n      {reflectionNotification && <AnnualReflectionModal notification={reflectionNotification} onClose={handleDismissReflection} />}"
    )
    content = content.replace("export default ResumeDashboard;", "</>\n  );\n}\n\nexport default ResumeDashboard;")

    with open(dashboard_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated ResumeDashboard.tsx for Annual Reflection Modal")

