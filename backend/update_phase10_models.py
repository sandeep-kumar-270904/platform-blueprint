import os

def main():
    backend_dir = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\backend"
    
    # 1. Create NewsAuditLog.js
    audit_log_path = os.path.join(backend_dir, "models", "NewsAuditLog.js")
    with open(audit_log_path, 'w', encoding='utf-8') as f:
        f.write("""const mongoose = require('mongoose');

const newsAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'delete', 'feature', 'unfeature'],
    required: true
  },
  targetArticleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('NewsAuditLog', newsAuditLogSchema);
""")
        
    # 2. Update User.js
    user_path = os.path.join(backend_dir, "models", "User.js")
    with open(user_path, 'r', encoding='utf-8') as f:
        user_content = f.read()
    if "hasCompletedNewsOnboarding:" not in user_content:
        user_content = user_content.replace(
            "newsStreak: {\n    current: { type: Number, default: 0 },\n    longest: { type: Number, default: 0 },\n    lastVisit: { type: Date }\n  }",
            "newsStreak: {\n    current: { type: Number, default: 0 },\n    longest: { type: Number, default: 0 },\n    lastVisit: { type: Date }\n  },\n  hasCompletedNewsOnboarding: {\n    type: Boolean,\n    default: false\n  }"
        )
        with open(user_path, 'w', encoding='utf-8') as f:
            f.write(user_content)

    # 3. Update NewsArticle.js
    article_path = os.path.join(backend_dir, "models", "NewsArticle.js")
    with open(article_path, 'r', encoding='utf-8') as f:
        article_content = f.read()
    if "readingTime:" not in article_content:
        article_content = article_content.replace(
            "sourceName: {\n    type: String,\n    required: true\n  }",
            "sourceName: {\n    type: String,\n    required: true\n  },\n  author: {\n    type: String,\n    default: 'Unknown'\n  },\n  readingTime: {\n    type: Number,\n    default: 3\n  }"
        )
        with open(article_path, 'w', encoding='utf-8') as f:
            f.write(article_content)

    print("Created NewsAuditLog.js, updated User.js and NewsArticle.js schemas")

if __name__ == '__main__':
    main()
