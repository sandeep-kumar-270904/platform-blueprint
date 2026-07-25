import os

def main():
    frontend_file = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\src\pages\TechNews.tsx"
    with open(frontend_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need an onboarding modal state
    if "const [onboardingOpen, setOnboardingOpen]" not in content:
        # Find useState for activeCategory
        idx = content.find("const [activeCategory, setActiveCategory] = useState('All');")
        if idx != -1:
            injection = "const [onboardingOpen, setOnboardingOpen] = useState(false);\n  "
            content = content[:idx] + injection + content[idx:]
            
        # Inside useEffect for fetchAuth, check hasCompletedNewsOnboarding
        auth_injection = """
        const token = localStorage.getItem('token');
        if (token) {
          api.get('/api/auth/me').then(res => {
             if (res.data && res.data.hasCompletedNewsOnboarding === false) {
                 setOnboardingOpen(true);
             }
          }).catch(console.error);
        }
        """
        # Find useEffect for activeCategory/auth maybe... Or just add it at the top of TechNews.
        # It's safer to inject a new useEffect below the states.
        
        use_effect_injection = """
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
         if (data && data.hasCompletedNewsOnboarding === false) {
             setOnboardingOpen(true);
         }
      })
      .catch(console.error);
    }
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/news/onboarding-complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ followedCategories: ['AI', 'Startups'] }) // Example default seeds
      });
      setOnboardingOpen(false);
      toast.success("Preferences saved!");
    } catch (err) {
      console.error(err);
      setOnboardingOpen(false);
    }
  };
"""
        idx_effect = content.find("const { articles, loading, loadingMore, hasMore, loadMore, refetch } = useNews")
        if idx_effect != -1:
            content = content[:idx_effect] + use_effect_injection + content[idx_effect:]
            
        # Add the modal JSX near the top of the return statement
        modal_jsx = """
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to AI & Tech News!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">Select your favorite topics to personalize your For You feed.</p>
            <div className="flex gap-2 flex-wrap mb-6">
              {['AI', 'Startups', 'Cybersecurity', 'Web Dev'].map(c => (
                <Badge key={c} variant="outline" className="cursor-pointer hover:bg-primary/10">{c}</Badge>
              ))}
            </div>
            <Button onClick={handleOnboardingComplete} className="w-full">Save & Continue</Button>
          </div>
        </DialogContent>
      </Dialog>
"""
        idx_return = content.find("<div className=\"max-w-7xl mx-auto space-y-6\">")
        if idx_return != -1:
            content = content[:idx_return + len("<div className=\"max-w-7xl mx-auto space-y-6\">")] + modal_jsx + content[idx_return + len("<div className=\"max-w-7xl mx-auto space-y-6\">"):]

    with open(frontend_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Updated TechNews.tsx with Onboarding Modal")

if __name__ == '__main__':
    main()
