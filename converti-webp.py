#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SMART CUCINE — converte le immagini in WebP.

Da lanciare DOPO  prepara-immagini.py

Cosa fa:
  1. converte in WebP tutte le immagini della cartella  immagini/
  2. tiene la versione piu' leggera: se il WebP pesa piu' dell'originale,
     l'originale resta
  3. riscrive i file del sito perche' usino i nuovi file
  4. sposta gli originali in  immagini-originali/  (non li cancella)

COME SI USA
      python3 converti-webp.py       (Mac e Linux)
      python converti-webp.py        (Windows)

  Serve la libreria Pillow. Se manca, installala con:
      pip install pillow

RISULTATO TIPICO
  Le foto pesano circa il 60-75% in meno. Il sito si apre molto piu'
  in fretta, e Google ne tiene conto nel posizionamento.
"""

import os, re, sys, shutil

try:
    from PIL import Image
except ImportError:
    print("Manca la libreria Pillow.\n")
    print("Installala con uno di questi comandi, poi rilancia lo script:\n")
    print("    pip install pillow")
    print("    python -m pip install pillow\n")
    sys.exit(1)

DIR = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(DIR, "immagini")
BACKUP = os.path.join(DIR, "immagini-originali")
ESTENSIONI = (".html", ".js", ".json", ".css", ".xml")
CONVERTIBILI = (".jpg", ".jpeg", ".png")
QUALITA = 82


def file_del_sito():
    for nome in sorted(os.listdir(DIR)):
        if nome.lower().endswith(ESTENSIONI):
            yield os.path.join(DIR, nome)


def immagini():
    for radice, _, nomi in os.walk(IMG):
        for n in sorted(nomi):
            if n.lower().endswith(CONVERTIBILI):
                yield os.path.join(radice, n)


def umano(byte):
    return f"{byte/1024/1024:.1f} MB" if byte >= 1024 * 1024 else f"{byte//1024} KB"


def main():
    if not os.path.isdir(IMG):
        print("Cartella  immagini/  non trovata.")
        print("Lancia prima:  python prepara-immagini.py")
        return 1

    elenco = list(immagini())
    if not elenco:
        print("Nessuna immagine da convertire.")
        return 0

    print(f"Trovate {len(elenco)} immagini.\n")
    mappa, prima, dopo, saltate = {}, 0, 0, 0

    for i, percorso in enumerate(elenco, 1):
        rel = os.path.relpath(percorso, DIR).replace(os.sep, "/")
        peso_vecchio = os.path.getsize(percorso)
        destinazione = os.path.splitext(percorso)[0] + ".webp"
        mostra = rel if len(rel) < 52 else "..." + rel[-49:]
        print(f"  [{i:3d}/{len(elenco)}] {mostra}", end=" ", flush=True)

        try:
            with Image.open(percorso) as im:
                if im.mode in ("RGBA", "LA", "P"):
                    im = im.convert("RGBA")
                    im.save(destinazione, "WEBP", quality=QUALITA, method=6)
                else:
                    im = im.convert("RGB")
                    im.save(destinazione, "WEBP", quality=QUALITA, method=6)
            peso_nuovo = os.path.getsize(destinazione)
        except Exception as e:
            print(f"ERRORE: {e}")
            saltate += 1
            continue

        if peso_nuovo >= peso_vecchio:
            os.remove(destinazione)
            print(f"{umano(peso_vecchio)} — tengo l'originale")
            saltate += 1
            continue

        risparmio = 100 - peso_nuovo * 100 // peso_vecchio
        print(f"{umano(peso_vecchio)} -> {umano(peso_nuovo)}  (-{risparmio}%)")
        prima += peso_vecchio
        dopo += peso_nuovo
        mappa[rel] = os.path.relpath(destinazione, DIR).replace(os.sep, "/")

    if not mappa:
        print("\nNessuna immagine convenienti da convertire.")
        return 0

    print(f"\nConvertite {len(mappa)} immagini: {umano(prima)} -> {umano(dopo)}  "
          f"(-{100 - dopo*100//prima}%)")
    if saltate:
        print(f"{saltate} lasciate come erano.")

    print("\nAggiorno i file del sito...")
    modificati = 0
    for percorso in file_del_sito():
        if os.path.basename(percorso) == os.path.basename(__file__):
            continue
        with open(percorso, encoding="utf-8") as f:
            testo = originale = f.read()
        for vecchio, nuovo in mappa.items():
            testo = testo.replace(vecchio, nuovo)
        if testo != originale:
            with open(percorso, "w", encoding="utf-8") as f:
                f.write(testo)
            modificati += 1
            print(f"  aggiornato  {os.path.basename(percorso)}")

    print(f"\nSposto gli originali in  immagini-originali/ ...")
    spostati = 0
    for rel in mappa:
        sorgente = os.path.join(DIR, rel.replace("/", os.sep))
        if not os.path.exists(sorgente):
            continue
        destinazione = os.path.join(BACKUP, os.path.relpath(sorgente, IMG))
        os.makedirs(os.path.dirname(destinazione), exist_ok=True)
        shutil.move(sorgente, destinazione)
        spostati += 1

    print(f"\nFatto.")
    print(f"  {modificati} file del sito aggiornati")
    print(f"  {spostati} originali spostati (puoi cancellarli quando sei sicuro)")
    print(f"  risparmio: {umano(prima - dopo)}")
    print("\nControlla il sito aprendo index.html prima di pubblicare.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrotto.")
        sys.exit(1)
