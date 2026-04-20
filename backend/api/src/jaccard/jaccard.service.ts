import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// @Injectable() : décorateur NestJS qui marque la classe comme un "provider".
// Cela permet à NestJS de l'injecter dans d'autres classes (ici le controller).
@Injectable()
export class JaccardService {
  // Injection de dépendance : NestJS fournit automatiquement une instance de PrismaService.
  // On pourra accéder à la DB via this.prisma dans toutes les méthodes de la classe.
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------------------
  // Méthode privée : récupère la liste des IDs des amis d'un user.
  // "private" = utilisable uniquement à l'intérieur de cette classe.
  // "async" = fonction asynchrone (elle fait des appels DB, donc elle attend).
  // Retourne : une Promise d'un tableau de numbers (les IDs des amis).
  // ----------------------------------------------------------------------------
  private async getAmisIds(userId: number): Promise<number[]> {
    // Requête Prisma : chercher toutes les FriendRequest où :
    //   - status = 'Accepted' (amitié validée)
    //   - ET (senderId = userId OU receiverId = userId) → notre user est impliqué
    // AND / OR sont des opérateurs Prisma pour combiner les conditions.
    const friendRequests = await this.prisma.friendRequest.findMany({
      where: {
        AND: [
          { status: 'Accepted' },
          {
            OR: [
              { senderId: userId },
              { receiverId: userId },
            ],
          },
        ],
      },
    });

    // Pour chaque friendRequest trouvée, on veut l'ID de l'AUTRE user (pas le nôtre).
    // Si on est le sender, l'ami est le receiver, et inversement.
    return friendRequests.map(fr =>
      fr.senderId === userId ? fr.receiverId : fr.senderId
    );
  }

  // ============================================================================
  // Méthode principale : calcule et retourne les suggestions pour un user.
  // - userId : l'ID du user pour qui on cherche des suggestions
  // - limit  : nombre max de suggestions à retourner (défaut 10, max 50)
  // ============================================================================
  async getSuggestions(userId: number, limit: number = 10): Promise<object[]> {
    // Clamp : on s'assure que limit ne dépasse jamais 50 (sécurité / performance).
    const safeLimit = Math.min(limit, 50);

    // ------------------------------------------------------------------------
    // ÉTAPE 1 : Récupérer le user courant avec tous ses intérêts.
    // "include" fait un JOIN : on charge aussi les relations.
    // "interests: { include: { interest: true } }" = pour chaque User_Interest,
    // on charge aussi l'objet Interest associé (pour avoir son nom).
    // ------------------------------------------------------------------------
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { interest: true } } },
    });

    // Sécurité : si le user n'existe pas dans la DB, on lève une erreur.
    if (!currentUser) throw new Error(`User ${userId} not found`);

    // Extraction des IDs des intérêts du user courant (utilisés pour les comparaisons).
    const currentInterestIds = currentUser.interests.map(i => i.interestId);

    // Création d'une Map { interestId → nom }.
    // Utile plus tard pour retourner le NOM des intérêts communs (pas juste les IDs).
    const interestMap = new Map(
      currentUser.interests.map(i => [i.interestId, i.interest.name])
    );

    // ------------------------------------------------------------------------
    // ÉTAPE 2 : Récupérer les IDs des amis à exclure des suggestions.
    // (On ne veut pas suggérer quelqu'un qui est déjà notre ami.)
    // ------------------------------------------------------------------------
    const amisIds = await this.getAmisIds(userId);

    // ------------------------------------------------------------------------
    // ÉTAPE 3 : Pré-filtrage Prisma — on ne récupère QUE les candidats qui :
    //   - ne sont PAS amis (notIn: [...amisIds, userId])
    //   - ne sont PAS le user lui-même
    //   - ont AU MOINS 1 intérêt en commun (some + in)
    // Ceci évite de calculer Jaccard sur des milliers de users sans aucun intérêt commun.
    // ------------------------------------------------------------------------
    const candidats = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...amisIds, userId] },
        interests: {
          some: { interestId: { in: currentInterestIds } },
        },
      },
      include: { interests: true },
    });

    // ------------------------------------------------------------------------
    // ÉTAPE 4 : Pour chaque candidat, calcul du score Jaccard + intérêts communs.
    // .map() transforme le tableau de users en tableau d'objets suggestions.
    // ------------------------------------------------------------------------
    const suggestions = candidats.map(user => {
      // IDs des intérêts du candidat.
      const interestIds = user.interests.map(i => i.interestId);

      // Calcul du score Jaccard (voir méthode plus bas).
      const score = this.jaccardScore(currentInterestIds, interestIds);

      // Liste des intérêts communs, avec { id, name } pour affichage côté front.
      const commonInterests = currentInterestIds
        .filter(id => interestIds.includes(id))
        .map(id => ({ id, name: interestMap.get(id) }));

      // On retourne un objet formaté pour la réponse JSON.
      return { userId: user.id, login: user.login, score, commonInterests };
    });

    // ------------------------------------------------------------------------
    // ÉTAPE 5 : Tri décroissant par score, puis on garde les N premiers.
    // .sort((a, b) => b.score - a.score) = du plus haut score au plus bas.
    // .slice(0, safeLimit) = on coupe après safeLimit éléments.
    // ------------------------------------------------------------------------
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit);
  }

  // ============================================================================
  // Méthode privée : calcule le score Jaccard entre deux tableaux d'IDs.
  // Formule : |intersection| / |union|
  //   - intersection : éléments présents dans A ET dans B
  //   - union        : éléments présents dans A OU dans B (sans doublons)
  // Résultat entre 0 (rien en commun) et 1 (identiques).
  // ============================================================================
  private jaccardScore(a: number[], b: number[]): number {
    // On transforme les tableaux en Set pour supprimer les doublons
    // et avoir des recherches rapides (O(1) avec .has()).
    const setA = new Set(a);
    const setB = new Set(b);

    // Intersection : on filtre les éléments de A qui sont aussi dans B.
    const intersection = [...setA].filter(x => setB.has(x));

    // Union : on fusionne A et B dans un nouveau Set (doublons auto-supprimés).
    const union = new Set([...setA, ...setB]);

    // Cas limite : si les deux sont vides, on évite une division par zéro.
    if (union.size === 0) return 0;

    // Score Jaccard final.
    return intersection.length / union.size;
  }
}
