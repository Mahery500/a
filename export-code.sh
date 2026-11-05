#!/bin/bash

# Usage : ./export.sh src [autre_dossier ...]

DIRECTORIES=("$@")

if [ ${#DIRECTORIES[@]} -eq 0 ]; then
    echo "❌ Usage : $0 dossier1 [dossier2 ...]"
    exit 1
fi

# 1) On construit la liste complète des fichiers
FILES=()
for DIRECTORY in "${DIRECTORIES[@]}"; do
    if [ ! -d "$DIRECTORY" ]; then
        echo "⚠️ Dossier introuvable : $DIRECTORY"
        continue
    fi

    while IFS= read -r FILE; do
        FILES+=("$FILE")
    done < <(
        find "$DIRECTORY" -type f \
            \( \
            -name "*.php" -o \
            -name "*.ts" -o \
            -name "*.tsx" -o \
            -name "*.js" -o \
            -name "*.jsx" -o \
            -name "*.json" -o \
            -name "*.yaml" -o \
            -name "*.yml" -o \
            -name "*.xml" -o \
            -name "*.css" -o \
            -name "*.scss" \
            \) \
            ! -path "*/vendor/*" \
            ! -path "*/node_modules/*" \
            ! -path "*/var/*" \
            | sort
    )
done

TOTAL=${#FILES[@]}

if [ "$TOTAL" -eq 0 ]; then
    echo "❌ Aucun fichier trouvé."
    exit 1
fi

echo "📂 $TOTAL fichiers trouvés."

# 2) Choix du nombre de parties
read -r -p "Diviser en combien de parties ? (1 = pas de division) [1] : " PARTS
PARTS=${PARTS:-1}

if ! [[ "$PARTS" =~ ^[1-9][0-9]*$ ]]; then
    echo "❌ Il faut un nombre entier supérieur à 0."
    exit 1
fi

if [ "$PARTS" -gt "$TOTAL" ]; then
    PARTS=$TOTAL
    echo "ℹ️ Plus de parties que de fichiers, je passe à $PARTS."
fi

# 3) Choix de la partie à exporter
CHOICE="1"
if [ "$PARTS" -gt 1 ]; then
    read -r -p "Quelle partie exporter ? (1 à $PARTS, ou 't' pour toutes) [t] : " CHOICE
    CHOICE=${CHOICE:-t}

    if [ "$CHOICE" != "t" ]; then
        if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt "$PARTS" ]; then
            echo "❌ Choix invalide."
            exit 1
        fi
    fi
fi

# Taille d'une partie (arrondi vers le haut)
SIZE=$(( (TOTAL + PARTS - 1) / PARTS ))

# 4) Fonction d'export d'une partie
export_part() {
    local INDEX=$1
    local OUTPUT

    if [ "$PARTS" -eq 1 ]; then
        OUTPUT="code_export.txt"
    else
        OUTPUT="code_export_part${INDEX}.txt"
    fi

    local START=$(( (INDEX - 1) * SIZE ))
    local SELECTED=("${FILES[@]:START:SIZE}")

    > "$OUTPUT"

    echo "EXPORT DU CODE" >> "$OUTPUT"
    echo "Projet : $(pwd)" >> "$OUTPUT"
    echo "Date   : $(date)" >> "$OUTPUT"
    if [ "$PARTS" -gt 1 ]; then
        echo "Partie : $INDEX/$PARTS (${#SELECTED[@]} fichiers sur $TOTAL)" >> "$OUTPUT"
    fi
    echo "" >> "$OUTPUT"

    for FILE in "${SELECTED[@]}"; do
        echo "==================================================" >> "$OUTPUT"
        echo "FICHIER : $FILE" >> "$OUTPUT"
        echo "LOCALISATION ABSOLUE : $(realpath "$FILE")" >> "$OUTPUT"
        echo "==================================================" >> "$OUTPUT"
        echo "" >> "$OUTPUT"

        cat "$FILE" >> "$OUTPUT"

        echo "" >> "$OUTPUT"
        echo "================ FIN DU FICHIER ==================" >> "$OUTPUT"
        echo "" >> "$OUTPUT"
    done

    echo "✅ $OUTPUT (${#SELECTED[@]} fichiers)"
}

# 5) Lancement
if [ "$CHOICE" = "t" ]; then
    for i in $(seq 1 "$PARTS"); do
        export_part "$i"
    done
else
    export_part "$CHOICE"
fi

echo "Export terminé."