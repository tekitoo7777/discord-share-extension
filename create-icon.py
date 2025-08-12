#!/usr/bin/env python3
"""
Discord Share Extension用のアイコンを生成するスクリプト
PILライブラリが必要: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """指定サイズのアイコンを作成"""
    # 新しい画像を作成（RGBA）
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 背景の角丸四角形を描画
    padding = size // 8
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=size // 5,
        fill=(88, 101, 242, 255)  # Discord Blue
    )
    
    # シェアアイコン（簡単な矢印）を描画
    center = size // 2
    arrow_size = size // 3
    
    # 矢印の頂点を計算
    points = [
        (center + arrow_size//2, center - arrow_size//3),  # 右上
        (center + arrow_size//2, center - arrow_size//6),  # 右中上
        (center, center - arrow_size//6),                   # 中央上
        (center, center + arrow_size//3),                   # 中央下
        (center - arrow_size//3, center),                   # 左中
        (center, center - arrow_size//3),                   # 上中
    ]
    
    # 白い矢印を描画
    draw.polygon(points, fill=(255, 255, 255, 255))
    
    # ハッシュタグを追加
    try:
        font_size = size // 3
        # システムフォントを使用（フォントがない場合はデフォルト）
        draw.text(
            (size // 10, size - size // 3),
            "#",
            fill=(255, 255, 255, 230),
            font=None
        )
    except:
        pass
    
    return img

def main():
    """メイン処理"""
    # iconsディレクトリを作成
    os.makedirs('icons', exist_ok=True)
    
    # 各サイズのアイコンを生成
    sizes = [16, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        filename = f'icons/icon{size}.png'
        icon.save(filename, 'PNG')
        print(f'Created: {filename}')
    
    print('All icons created successfully!')

if __name__ == '__main__':
    main()