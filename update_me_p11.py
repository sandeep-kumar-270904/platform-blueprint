import os

routes_path = "backend/routes/me.js"
with open(routes_path, "r", encoding="utf-8") as f:
    routes_content = f.read()

if "populate('institutionId')" not in routes_content:
    routes_content = routes_content.replace(
        "const user = await User.findById(req.user.id).select('-password');",
        "const user = await User.findById(req.user.id).select('-password').populate('institutionId');"
    )
    with open(routes_path, "w", encoding="utf-8") as f:
        f.write(routes_content)
    print("Updated me.js routes")

