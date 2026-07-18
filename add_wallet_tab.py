import os

file_path = "src/pages/ResumeDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add CertificationWallet import
content = content.replace("import { CoverLetterList } from \"@/components/resume/CoverLetterList\";", "import { CoverLetterList } from \"@/components/resume/CoverLetterList\";\nimport { CertificationWallet } from \"@/components/resume/CertificationWallet\";")

# Add Wallet tab
content = content.replace("<TabsList className=\"mb-6 w-full max-w-md mx-auto grid grid-cols-2\">", "<TabsList className=\"mb-6 w-full max-w-2xl mx-auto grid grid-cols-3\">")
content = content.replace("<TabsTrigger value=\"cover-letters\">Cover Letters</TabsTrigger>", "<TabsTrigger value=\"cover-letters\">Cover Letters</TabsTrigger>\n                <TabsTrigger value=\"wallet\">Certifications Wallet</TabsTrigger>")

# Add Wallet Tab Content
wallet_tab = """
              <TabsContent value="wallet" className="mt-0">
                <CertificationWallet />
              </TabsContent>
"""
content = content.replace("</TabsContent>\n            </Tabs>", "</TabsContent>\n" + wallet_tab + "\n            </Tabs>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added CertificationWallet to ResumeDashboard.tsx")
