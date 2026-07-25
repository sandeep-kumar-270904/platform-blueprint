import os

def main():
    frontend_file = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\src\pages\TechNews.tsx"
    with open(frontend_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 1. Imports
    import_additions = """import { ArticleCard } from "@/components/news/ArticleCard";
import { MorningBriefWidget } from "@/components/news/MorningBriefWidget";"""
    if "import { ArticleCard }" not in content:
        content = content.replace('import useEmblaCarousel from "embla-carousel-react";', 
                                 'import useEmblaCarousel from "embla-carousel-react";\n' + import_additions)
                                 
    # 2. Strip inline CommentsSection
    # Finding start and end
    # It starts at `const CommentsSection = ({ articleId }` and ends before `const TechNews = () => {`
    
    start_str_comments = "const CommentsSection = ({ articleId }: { articleId: string }) => {"
    end_str_comments = "const TechNews = () => {"
    if start_str_comments in content:
        start_idx = content.find(start_str_comments)
        end_idx = content.find(end_str_comments)
        if start_idx != -1 and end_idx != -1:
            content = content[:start_idx] + content[end_idx:]
            
    # 3. Strip inline ArticleCard
    start_str_card = "const ArticleCard = ({ article, isAdminMode, savedIds, toggleLocalSavedId, onAdminAction }: any) => {"
    end_str_card = "const TrendingTagsWidget"
    if start_str_card in content:
        start_idx = content.find(start_str_card)
        end_idx = content.find(end_str_card)
        if start_idx != -1 and end_idx != -1:
            content = content[:start_idx] + content[end_idx:]
            
    # 4. Mount MorningBriefWidget and TrendingTagsWidget
    # Find `{!adminMode && !searchInput && <TrendingCarousel />}`
    mount_point = "{!adminMode && !searchInput && <TrendingCarousel />}"
    if mount_point in content:
        replacement = """
        {!adminMode && !searchInput && (
          <>
            <MorningBriefWidget />
            <TrendingCarousel />
            <TrendingTagsWidget onSelectTag={(t) => { setSearchInput(t); setForYou(false); setActiveCategory('All'); }} />
          </>
        )}
        """
        content = content.replace(mount_point, replacement)
        
    with open(frontend_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Updated TechNews.tsx")

if __name__ == '__main__':
    main()
