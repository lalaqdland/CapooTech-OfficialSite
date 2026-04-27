# 图片自动处理功能说明

## 概述

本文档介绍新增的图片自动处理功能，包括：
- 自动重命名（防止覆盖）
- 自动转换为 WebP 格式
- 自动压缩优化
- 自动更新 photos.json 引用

## 新增文件

### 1. GitHub Actions 工作流
**路径**: `.github/workflows/process-images.yml`

**触发条件**:
- 当 `images/capoo/` 目录有文件变更时自动触发
- 当 `data/photos.json` 有变更时自动触发
- 支持手动触发（workflow_dispatch）

**功能**:
- 检出代码
- 安装 Python 和依赖（Pillow）
- 安装 ImageMagick
- 运行图片处理脚本
- 自动提交并推送更改

### 2. 图片处理脚本
**路径**: `ops/image-processor/process_images.py`

**核心功能**:

#### 自动重命名
- 规则: `capoo-YYYYMMDD-HHMMSS[-XX].webp`
- 示例: `capoo-20260426-143022.webp` 或 `capoo-20260426-143022-02.webp`
- 目的: 防止同名文件覆盖，保持文件名唯一性

#### 自动转换为 WebP
- 支持格式: JPG、PNG、GIF、BMP、TIFF
- 转换后格式: WebP
- 优势: 更小的文件体积，更好的 Web 兼容性

#### 自动压缩优化
- 质量: 85%（平衡画质和体积）
- 最大尺寸: 1920x1920 像素（超出会等比缩放）
- 优化模式: 开启，使用最高压缩级别

#### 自动更新引用
- 扫描 `data/photos.json` 中的所有图片 URL
- 自动替换为处理后的新文件名
- 保持 JSON 格式一致性

#### 去重功能
- 基于文件内容哈希（MD5）检测重复
- 相同内容的图片只保留一份
- 自动更新所有引用指向同一份文件

### 3. 更新后的 CMS 配置
**路径**: `admin/config.yml`

**更新内容**:
- 添加了详细的字段提示（hint）
- 说明自动处理功能
- 提醒用户注意事项

## 使用流程

### 方式一：通过 Sveltia CMS（推荐）

1. 访问 `https://capootech.com/admin/`
2. 点击 "Sign In with GitHub" 登录
3. 左侧选择 **Site Content** → **Cat Gallery**
4. 在 "🌟 Cat Photos" 列表中：
   - 点击 **Add** 添加新图片
   - 点击 **Image** 输入框，选择本地文件上传
   - 拖拽调整顺序
   - 点击列表项右侧的删除图标移除图片引用
5. 点击右上角 **Save** 或 **Publish** → **Publish now**
6. **自动处理流程开始**:
   - Sveltia CMS 会创建两个 commit：
     1. 上传图片到 `images/capoo/`
     2. 更新 `data/photos.json`
   - GitHub Actions 检测到变更，自动触发 `process-images.yml` 工作流
   - 工作流运行图片处理脚本：
     - 重命名图片
     - 转换为 WebP
     - 压缩优化
     - 更新 `photos.json` 中的引用
   - 工作流自动提交更改并推送到 `main` 分支
   - 触发 `deploy-capootech.yml` 部署到服务器
7. 等待约 2-5 分钟，刷新首页验证

### 方式二：手动本地处理

如果你想在本地测试或手动运行：

```bash
# 进入仓库目录
cd ~/workspace/capootech/capootech-officialsite

# 安装依赖
pip install pillow

# 运行处理脚本（预览模式，不实际修改）
python ops/image-processor/process_images.py --dry-run

# 实际运行处理
python ops/image-processor/process_images.py

# 提交更改
git add -A
git commit -m "chore(images): auto-process images"
git push origin main
```

### 方式三：通过 GitHub Actions 手动触发

1. 打开 GitHub 仓库页面
2. 进入 **Actions** 标签
3. 左侧选择 **Process and Optimize Images**
4. 点击右侧 **Run workflow**
5. 可选：勾选 **Dry run** 仅预览更改
6. 点击 **Run workflow** 按钮

## 文件映射

需要将以下文件复制到你的 WSL 仓库：

```
# 从 Windows 目录
D:\Documents\Coding\Trae\
├── .github/
│   └── workflows/
│       └── process-images.yml    # 新增工作流
├── admin/
│   └── config.yml                 # 更新后的配置（替换原有）
└── ops/
    └── image-processor/
        └── process_images.py      # 新增处理脚本
```

**复制到 WSL 仓库**:
```
\\wsl.localhost\Ubuntu\home\lalaqdland\workspace\capootech\capootech-officialsite\
├── .github/
│   └── workflows/
│       ├── deploy-capootech.yml      # 原有
│       ├── upload-cat-photos.yml     # 原有
│       └── process-images.yml        # 新增 ←
├── admin/
│   ├── index.html                     # 原有
│   └── config.yml                     # 更新 ←
├── ops/
│   ├── nginx/
│   ├── cms-auth/
│   └── image-processor/               # 新增目录 ←
│       └── process_images.py          # 新增 ←
└── ... 其他原有文件
```

## 部署步骤

### 1. 先提交当前更改（重要！）

在复制新文件之前，确保你的工作区是干净的，或者先提交现有更改：

```bash
cd ~/workspace/capootech/capootech-officialsite

# 检查状态
git status

# 如果有未提交的更改，先提交
git add -A
git commit -m "chore: save current changes before adding image processing"
git push origin main
```

### 2. 复制文件到 WSL 仓库

从 Windows 资源管理器或命令行复制：

```powershell
# 在 Windows PowerShell 中执行（以管理员身份）
# 假设 WSL 路径为：\\wsl.localhost\Ubuntu\home\lalaqdland\workspace\capootech\capootech-officialsite

# 复制工作流文件
Copy-Item -Path "D:\Documents\Coding\Trae\.github\workflows\process-images.yml" -Destination "\\wsl.localhost\Ubuntu\home\lalaqdland\workspace\capootech\capootech-officialsite\.github\workflows\" -Force

# 复制处理脚本（先创建目录）
New-Item -ItemType Directory -Path "\\wsl.localhost\Ubuntu\home\lalaqdland\workspace\capootech\capootech-officialsite\ops\image-processor" -Force
Copy-Item -Path "D:\Documents\Coding\Trae\ops\image-processor\process_images.py" -Destination "\\wsl.localhost\Ubuntu\home\lalaqdland\workspace\capootech\capootech-officialsite\ops\image-processor\" -Force

# 复制更新后的 config.yml
Copy-Item -Path "D:\Documents\Coding\Trae\admin\config.yml" -Destination "\\wsl.localhost\Ubuntu\home\lalaqdland\workspace\capootech\capootech-officialsite\admin\" -Force
```

或者在 WSL 终端中直接操作：

```bash
# 在 WSL 终端中
cd ~/workspace/capootech/capootech-officialsite

# 创建目录
mkdir -p .github/workflows ops/image-processor admin

# 从 Windows 挂载点复制（假设 D 盘挂载在 /mnt/d）
cp /mnt/d/Documents/Coding/Trae/.github/workflows/process-images.yml .github/workflows/
cp /mnt/d/Documents/Coding/Trae/ops/image-processor/process_images.py ops/image-processor/
cp /mnt/d/Documents/Coding/Trae/admin/config.yml admin/
```

### 3. 提交并推送新文件

```bash
cd ~/workspace/capootech/capootech-officialsite

# 检查新文件
git status

# 添加新文件
git add .github/workflows/process-images.yml
git add ops/image-processor/process_images.py
git add admin/config.yml

# 提交
git commit -m "feat(images): add auto-processing workflow

- Add GitHub Actions workflow for automatic image processing
- Add Python script to:
  - Auto-rename images with timestamp (prevents overwriting)
  - Auto-convert to WebP format
  - Auto-compress/optimize images
  - Auto-update photos.json references
  - Detect and handle duplicates
- Update admin/config.yml with helpful hints"

# 推送到远程
git push origin main
```

### 4. 验证部署

1. 打开 GitHub 仓库页面
2. 进入 **Actions** 标签
3. 应该看到 **Process and Optimize Images** 工作流已经注册
4. 可以手动触发一次测试（选择 Dry run 模式）

## 注意事项

### 关于文件覆盖

**Q: 上传同名文件会覆盖吗？**

A: 分两个阶段：

1. **Sveltia CMS 阶段**: 如果你上传的文件名与仓库中已有的文件完全相同（如 `capoo-01.webp`），Sveltia CMS **会直接覆盖**原文件。

2. **自动处理阶段**: 无论上传什么文件名，GitHub Actions 工作流都会：
   - 将文件重命名为 `capoo-YYYYMMDD-HHMMSS.webp` 格式
   - 这个名称包含时间戳，**几乎不可能重复**
   - 所以即使你上传了同名文件，处理后也会有不同的文件名

**最佳实践**:
- 不需要担心文件名，直接上传即可
- 系统会自动处理重命名，防止覆盖
- 如果你想确保绝对不覆盖，可以在上传前给文件一个有意义的名称（如 `capoo-sleeping.jpg`）

### 关于删除图片

**当前限制**:
- 从 CMS 列表中删除条目，只会更新 `photos.json`，**不会删除物理文件**
- 图片文件仍会保留在 `images/capoo/` 目录中

**未来计划**:
- 可以添加定期清理未引用图片的功能
- 或者手动检查并删除不再需要的图片

### 关于已有图片

- 已有的 `capoo-01.webp`、`capoo-02.webp` 等文件**不会被自动处理**
- 只有当文件名不符合 `capoo-YYYYMMDD-*.webp` 格式时才会被处理
- 如果你想处理现有图片，可以：
  1. 手动运行脚本: `python ops/image-processor/process_images.py`
  2. 或者在 CMS 中重新上传这些图片

### 关于性能

- 图片处理在 GitHub Actions 服务器上运行，不影响你的本地环境
- 处理时间取决于图片数量和大小，通常每张图片几秒钟
- 工作流会自动处理所有新增和变更的图片

## 故障排查

### 工作流没有触发？

检查:
1. 确保文件推送到了 `main` 分支
2. 确保变更的文件路径匹配:
   - `images/capoo/**`
   - `data/photos.json`
3. 检查 GitHub Actions 的权限设置

### 图片处理失败？

查看工作流日志:
1. GitHub 仓库 → Actions → 选择对应的工作流运行
2. 查看每个步骤的日志输出
3. 常见错误:
   - 图片格式不支持（虽然脚本支持大多数常见格式）
   - 图片文件损坏
   - 磁盘空间不足

### 引用没有更新？

检查:
1. 确保 `photos.json` 格式正确
2. 确保 URL 格式匹配（`/images/capoo/filename.webp`）
3. 查看工作流日志中的 "URL mappings" 部分

## 技术细节

### 图片处理流程

```
1. 扫描 images/capoo/ 目录
   ↓
2. 对每个文件判断是否需要处理
   - 已是 capoo-YYYYMMDD-*.webp 格式？→ 跳过
   - 其他格式？→ 需要处理
   ↓
3. 计算文件哈希值
   - 哈希已存在？→ 重复文件，删除并更新引用
   - 新哈希？→ 继续处理
   ↓
4. 生成新文件名
   - 格式: capoo-YYYYMMDD-HHMMSS[-XX].webp
   - 检查文件名冲突，自动添加序号
   ↓
5. 处理图片
   - 打开图片
   - 转换为 RGB 模式（处理透明背景）
   - 等比缩放（最大 1920px）
   - 保存为 WebP（质量 85%）
   ↓
6. 更新引用
   - 读取 photos.json
   - 替换所有旧 URL 为新 URL
   - 保存更新后的 JSON
   ↓
7. 清理
   - 删除原文件（如果不是 WebP 格式）
   - 记录处理统计
```

### 依赖说明

**Python 包**:
- `pillow`: Python 图像处理库，用于打开、转换、保存图片

**系统工具**:
- `imagemagick`: 备用图像处理工具（当前脚本主要用 Pillow）

## 总结

新增的图片自动处理功能解决了你的核心问题：

| 问题 | 解决方案 |
|------|----------|
| 上传的图片文件名是一串编码 | 自动重命名为 `capoo-YYYYMMDD-HHMMSS.webp` |
| 同名文件会覆盖 | 时间戳命名确保唯一性，几乎不可能重复 |
| 需要手动转 WebP | 自动检测并转换为 WebP 格式 |
| 需要手动压缩 | 自动压缩到 85% 质量，最大 1920px |
| 手动更新 photos.json | 自动扫描并更新所有引用 |

## 下一步建议

1. **立即**: 按照"部署步骤"将文件复制到 WSL 仓库并提交
2. **测试**: 手动触发一次工作流（Dry run 模式）验证配置
3. **使用**: 通过 CMS 上传一张新图片，观察完整流程
4. **优化**: 根据实际使用情况调整参数（如质量、最大尺寸等）

如果遇到任何问题，请查看 GitHub Actions 日志或检查脚本输出。
