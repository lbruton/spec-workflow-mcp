# Guide utilisateur

Un guide complet pour utiliser Spec Workflow MCP pour le développement logiciel assisté par IA.

## Pour commencer

### Qu'est-ce que Spec Workflow MCP ?

Spec Workflow MCP est un serveur Model Context Protocol qui fournit des outils de développement structurés et basés sur les spécifications aux assistants IA. Il vous aide à :

- Créer des spécifications détaillées avant de coder
- Suivre la progression de l'implémentation
- Gérer les approbations et révisions
- Maintenir la documentation du projet

### Flux de travail de base

1. **Créer une spécification** - Définir ce que vous voulez construire
2. **Réviser et approuver** - S'assurer que les spécifications répondent aux exigences
3. **Implémenter les tâches** - Exécuter le plan d'implémentation
4. **Suivre la progression** - Surveiller l'état d'achèvement

## Création de spécifications

### Création simple de spécification

Demandez à votre assistant IA de créer une spécification :

```
"Créer une spécification pour l'authentification utilisateur"
```

L'IA va automatiquement :
1. Créer un document d'exigences
2. Concevoir l'approche technique
3. Décomposer l'implémentation en tâches

### Création détaillée de spécification

Fournissez plus de contexte pour de meilleures spécifications :

```
"Créer une spécification appelée passerelle-paiement avec les fonctionnalités suivantes :
- Traitement par carte de crédit
- Intégration PayPal
- Gestion des abonnements
- Gestion des webhooks pour les événements de paiement"
```

### À partir de documents existants

Utilisez vos documents PRD ou de conception existants :

```
"Créer une spécification à partir de @exigences-produit.md"
```

## Gestion des spécifications

### Lister toutes les spécifications

```
"Lister toutes mes spécifications"
```

Retourne :
- Noms des spécifications
- Statut actuel
- Pourcentage de progression
- États des documents

### Vérifier le statut d'une spécification

```
"Montrer le statut de la spécification user-auth"
```

Fournit :
- Statut d'approbation des exigences
- Statut d'approbation de la conception
- Progression de l'achèvement des tâches
- Décomposition détaillée des tâches

### Visualiser les documents de spécification

Utilisez le tableau de bord ou l'extension VSCode pour :
- Lire les documents d'exigences
- Réviser les documents de conception
- Parcourir les listes de tâches
- Suivre la progression de l'implémentation

## Travailler avec les tâches

### Structure des tâches

Les tâches sont organisées hiérarchiquement :
- **1.0** - Sections principales
  - **1.1** - Sous-tâches
  - **1.2** - Sous-tâches
    - **1.2.1** - Étapes détaillées

### Implémenter des tâches

#### Méthode 1 : Implémentation directe
```
"Implémenter la tâche 1.2 de la spécification user-auth"
```

#### Méthode 2 : Copier depuis le tableau de bord
1. Ouvrir le tableau de bord
2. Naviguer vers votre spécification
3. Cliquer sur l'onglet "Tâches"
4. Cliquer sur le bouton "Copier le prompt" à côté de n'importe quelle tâche
5. Coller dans votre conversation IA

#### Méthode 3 : Implémentation par lot
```
"Implémenter toutes les tâches de configuration de base de données de la spécification user-auth"
```

### Statut des tâches

Les tâches ont trois états :
- ⏳ **En attente** - Non commencée
- 🔄 **En cours** - En cours de traitement
- ✅ **Terminée** - Finie

## Flux d'approbation

### Demander une approbation

Lorsque les documents sont prêts pour révision :

1. L'IA demande automatiquement l'approbation
2. Le tableau de bord affiche une notification
3. Réviser le document
4. Fournir un retour ou approuver

### Actions d'approbation

- **Approuver** - Accepter le document tel quel
- **Demander des modifications** - Fournir un retour pour révision
- **Rejeter** - Recommencer avec de nouvelles exigences

### Processus de révision

1. Fournir un retour spécifique
2. L'IA révise le document
3. Réviser la version mise à jour
4. Approuver ou demander d'autres modifications

## Flux de travail des bugs

### Signaler des bugs

```
"Créer un rapport de bug pour l'échec de connexion lors de l'utilisation de SSO"
```

Crée :
- Description du bug
- Étapes pour reproduire
- Comportement attendu vs réel
- Priorité et gravité

### Résolution de bugs

```
"Créer une correction pour le bug #123 dans la spécification user-auth"
```

Génère :
- Analyse de cause racine
- Plan d'implémentation de la correction
- Exigences de test
- Étapes de déploiement

## Système de modèles

### Utilisation des modèles

Spec Workflow inclut des modèles pour :
- Documents d'exigences
- Documents de conception
- Listes de tâches
- Rapports de bugs
- Documents de pilotage

### Modèles personnalisés

Créez vos propres modèles dans `.specflow/templates/` :

```markdown
# Modèle de fonctionnalité personnalisée

## Aperçu
[Description de la fonctionnalité]

## Histoires utilisateur
[Histoires utilisateur]

## Exigences techniques
[Détails techniques]
```

## Fonctionnalités avancées

### Documents de pilotage

Créez des guides de projet de haut niveau :

```
"Créer des documents de pilotage pour mon projet e-commerce"
```

Génère :
- **Pilotage produit** - Vision et objectifs
- **Pilotage technique** - Décisions d'architecture
- **Pilotage de structure** - Organisation du projet

### Système d'archives

Gérez les spécifications terminées :
- Déplacer les spécifications finies vers les archives
- Garder l'espace de travail actif propre
- Accéder aux spécifications archivées à tout moment
- Restaurer les spécifications si nécessaire

### Support multilingue

Changer la langue de l'interface :

1. **Tableau de bord** : Paramètres → Langue
2. **Extension VSCode** : Paramètres de l'extension → Langue
3. **Fichier de configuration** : `lang = "fr"` (ou autre code de langue)

## Bonnes pratiques

### 1. Commencer par les documents de pilotage

Avant de créer des spécifications :
```
"Créer des documents de pilotage pour guider le projet"
```

### 2. Être spécifique dans les exigences

Bon :
```
"Créer une spécification pour l'authentification utilisateur avec :
- Connexion email/mot de passe
- OAuth2 (Google, GitHub)
- Support 2FA
- Flux de réinitialisation du mot de passe"
```

Pas idéal :
```
"Créer une spécification de connexion"
```

### 3. Réviser avant l'implémentation

Toujours réviser et approuver :
1. Document d'exigences
2. Document de conception
3. Décomposition des tâches

### 4. Implémenter progressivement

- Terminer les tâches dans l'ordre
- Tester après chaque section principale
- Mettre à jour régulièrement le statut des tâches

### 5. Utiliser le tableau de bord

Le tableau de bord fournit :
- Suivi visuel de la progression
- Navigation facile des documents
- Actions d'approbation rapides
- Mises à jour en temps réel

## Flux de travail courants

### Développement de fonctionnalité

1. Créer une spécification : `"Créer une spécification pour la fonctionnalité panier d'achat"`
2. Réviser les exigences dans le tableau de bord
3. Approuver ou demander des modifications
4. Réviser le document de conception
5. Approuver la conception
6. Implémenter les tâches séquentiellement
7. Suivre la progression dans le tableau de bord

### Correction de bugs

1. Signaler un bug : `"Créer un rapport de bug pour l'erreur de paiement"`
2. Analyser : `"Analyser la cause racine du bug #45"`
3. Planifier la correction : `"Créer un plan de correction pour le bug #45"`
4. Implémenter : `"Implémenter la correction"`
5. Vérifier : `"Créer un plan de test pour la correction du bug #45"`

### Refactoring

1. Créer une spécification : `"Créer une spécification pour l'optimisation de la base de données"`
2. Documenter l'état actuel
3. Concevoir les améliorations
4. Planifier les étapes de migration
5. Implémenter progressivement
6. Vérifier chaque étape

## Astuces et conseils

### Gestion efficace des tâches

- Utiliser le regroupement de tâches pour les éléments connexes
- Copier les prompts depuis le tableau de bord pour plus de précision
- Marquer les tâches comme terminées immédiatement après la fin

### Gestion des documents

- Garder les exigences concises mais complètes
- Inclure les critères d'acceptation
- Ajouter les contraintes techniques dans la conception
- Référencer les documents externes si nécessaire

### Collaboration

- Utiliser les commentaires d'approbation pour les retours
- Partager l'URL du tableau de bord avec l'équipe
- Exporter les documents pour révision externe
- Suivre les modifications via l'historique de révision

## Intégration avec les assistants IA

### Conscience contextuelle

L'assistant IA automatiquement :
- Connaît la structure de votre projet
- Comprend les relations entre spécifications
- Suit la progression de l'implémentation
- Maintient la cohérence

### Commandes en langage naturel

Parlez naturellement :
- "Quelles spécifications ai-je ?"
- "Montre-moi ce qu'il reste à faire"
- "Commencer à travailler sur la prochaine tâche"
- "Mettre à jour la conception pour de meilleures performances"

### Flux de travail continu

L'IA maintient le contexte entre les sessions :
- Reprendre là où vous vous êtes arrêté
- Référencer les décisions précédentes
- Construire sur le travail existant
- Maintenir la cohérence du projet

## Documentation associée

- [Processus de flux de travail](WORKFLOW.fr.md) - Guide détaillé du flux de travail
- [Guide de prompting](PROMPTING-GUIDE.fr.md) - Exemples de prompts
- [Guide des interfaces](INTERFACES.fr.md) - Détails du tableau de bord et de l'extension
- [Référence des outils](TOOLS-REFERENCE.fr.md) - Documentation complète des outils
