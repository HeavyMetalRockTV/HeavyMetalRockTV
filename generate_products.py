#!/usr/bin/env python3
"""
Heavy Metal Rock TV - Catalog Generator & Synchronizer
Architected by Arthas Menethil | Lich King Engine ❄️
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any

# --- CONFIGURACIÓN MAESTRA ---
IMG_ROOT = Path("img")
OUTPUT_JSON = Path("data/products.json")

# Mapeo: Nombre de carpeta en disco -> Categoría canónica esperada por deploy.yml
CATEGORY_MAPPING: Dict[str, str] = {
    "polos": "polos",
    "casacas": "casacas",
    "casacas de cuero": "casacas",
    "poleras": "poleras",
    "pantalones": "pantalones",
    "calzado": "calzado",
    "mochilas": "mochilas",
    "accesorios": "accesorios",
    "posters": "posters",
    "pósters": "posters",
    "discoss vinilo": "vinilos",
    "discos & vinilos": "vinilos",
    "albums": "vinilos",
    "emo": "polos",
    "estampados": "polos"
}

# Precios por defecto según categoría
DEFAULT_PRICING: Dict[str, str] = {
    "polos": "S/ 55.00",
    "casacas": "S/ 140.00",
    "poleras": "S/ 90.00",
    "pantalones": "S/ 85.00",
    "calzado": "S/ 120.00",
    "mochilas": "S/ 75.00",
    "accesorios": "S/ 35.00",
    "posters": "S/ 25.00",
    "vinilos": "S/ 110.00"
}

# Plantillas de descripción por defecto
DEFAULT_DESCRIPTIONS: Dict[str, str] = {
    "polos": "100% Algodón reactivo con estampado de alta durabilidad en serigrafía.",
    "casacas": "Casaca denim/cuero con parches oficiales y acabado metalero de alta resistencia.",
    "poleras": "Polera con capucha y franela reactiva de máxima densidad térmica.",
    "pantalones": "Pantalón de corte clásico con remaches reforzados para conciertos.",
    "calzado": "Calzado urbano de cuero reforzado con suela antideslizante.",
    "mochilas": "Mochila táctica/urbana de alta capacidad con compartimentos reforzados.",
    "accesorios": "Accesorio oficial de metal pesado y colección exclusiva.",
    "posters": "Afiche de alta resolución en papel couché de 300g.",
    "vinilos": "Edición oficial en vinilo/disco para coleccionistas con audio masterizado."
}

# Diccionario de nombres de bandas para formateo capitalizado correcto
BAND_ALIASES: Dict[str, str] = {
    "acdc": "AC/DC",
    "ac-dc": "AC/DC",
    "accept": "Accept",
    "ironmaiden": "Iron Maiden",
    "iron-maiden": "Iron Maiden",
    "judaspriest": "Judas Priest",
    "cannibalcorpse": "Cannibal Corpse",
    "morbidangel": "Morbid Angel",
    "black-sabbath": "Black Sabbath",
    "blacksabbath": "Black Sabbath",
    "motorhead": "Motörhead",
    "dio": "Dio",
    "kreator": "Kreator",
    "slayer": "Slayer",
    "metallica": "Metallica",
    "megadeth": "Megadeth",
    "sepultura": "Sepultura"
}


def parse_filename(stem: str, category: str) -> tuple[str, str]:
    """
    Parsea el nombre base del archivo para extraer la Banda y el Nombre del Producto.
    Ejemplo: 'accept_metal_heart' -> ('Accept', 'Polo Accept - Metal Heart')
             'acdc_1' -> ('AC/DC', 'Polo AC/DC - Classic Logo 1')
    """
    # Limpiar caracteres extraños
    clean_stem = re.sub(r'[\(\)\[\]]', '', stem).strip()
    
    # Separar por guión bajo o guión medio
    parts = re.split(r'[-_]+', clean_stem)
    
    if len(parts) >= 2:
        raw_band = parts[0].lower()
        band = BAND_ALIASES.get(raw_band, parts[0].capitalize())
        
        # El resto compone el detalle
        detail_raw = " ".join(parts[1:]).title()
        
        # Si el detalle es solo un número (e.g. '1', '2')
        if detail_raw.isdigit():
            detail = f"Oficial #{detail_raw}"
        else:
            detail = detail_raw
            
        nombre = f"{category.capitalize()[:-1] if category.endswith('s') else category.capitalize()} {band} - {detail}"
    else:
        raw_name = clean_stem.replace('_', ' ').replace('-', ' ').title()
        band = BAND_ALIASES.get(clean_stem.lower(), raw_name)
        nombre = f"{category.capitalize()[:-1] if category.endswith('s') else category.capitalize()} {raw_name}"
        
    return band, nombre


def build_catalog() -> List[Dict[str, Any]]:
    print("[*] Iniciando escaneo y reconstrucción del catálogo de reliquias... ❄️")
    
    # 1. Cargar catálogo existente para no perder personalizaciones manuales
    existing_by_img: Dict[str, Dict[str, Any]] = {}
    if OUTPUT_JSON.exists():
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if "imagen" in item:
                            # Normalizar ruta a forward slashes
                            norm_img = item["imagen"].replace("\\", "/")
                            existing_by_img[norm_img] = item
            print(f"  [i] {len(existing_by_img)} artículos preexistentes indexados en memoria.")
        except Exception as e:
            print(f"  [!] Advertencia al leer {OUTPUT_JSON}: {e}. Se creará desde cero.")

    catalog: List[Dict[str, Any]] = []
    current_id = 1

    # 2. Recorrer directorios de imágenes
    for folder_path in sorted(IMG_ROOT.iterdir()):
        if not folder_path.is_dir():
            continue
            
        folder_name = folder_path.name.lower()
        
        # Ignorar carpetas no clasificadas como productos (e.g., 'estetica', 'bandas logo')
        if folder_name not in CATEGORY_MAPPING:
            print(f"  [-] Omitiendo directorio fuera de catálogo: '{folder_name}'")
            continue
            
        category = CATEGORY_MAPPING[folder_name]
        
        # Escanear imágenes WebP (y fallbacks si quedan)
        image_files = sorted(
            [f for f in folder_path.iterdir() if f.is_file() and f.suffix.lower() in ('.webp', '.png', '.jpg', '.jpeg')],
            key=lambda x: x.name.lower()
        )

        for img_file in image_files:
            rel_path = f"img/{folder_path.name}/{img_file.name}".replace("\\", "/")
            
            # Si el artículo ya existía, preservamos sus metadatos y reindexamos ID
            if rel_path in existing_by_img:
                item = existing_by_img[rel_path].copy()
                item["id"] = current_id
                item["categoria"] = category  # Forzar consistencia de categoría
                catalog.append(item)
            else:
                # Generar nuevo artículo con heurística
                band, nombre = parse_filename(img_file.stem, category)
                precio = DEFAULT_PRICING.get(category, "S/ 55.00")
                descripcion = DEFAULT_DESCRIPTIONS.get(category, "Artículo oficial de alta durabilidad y edición limitada.")
                
                new_item = {
                    "id": current_id,
                    "nombre": nombre,
                    "banda": band,
                    "categoria": category,
                    "precio": precio,
                    "imagen": rel_path,
                    "descripcion": descripcion
                }
                catalog.append(new_item)
                
            current_id += 1

    return catalog


def save_catalog(catalog: List[Dict[str, Any]]) -> None:
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\n[✔] Catálogo forjado exitosamente en: {OUTPUT_JSON}")
    print(f"[✔] Total de reliquias indexadas: {len(catalog)} 💀❄️")


if __name__ == "__main__":
    if not IMG_ROOT.exists():
        print(f"[FATAL] El directorio '{IMG_ROOT}' no existe. Abortando.")
        exit(1)
        
    catalog_data = build_catalog()
    save_catalog(catalog_data)