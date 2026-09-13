# PEDAGOGIA · La guerra submarina: matemàtiques i estratègia en 3D

## Públic i nivell

Alumnat de 3r i 4t d'ESO (14-16 anys). Útil també a 2n d'ESO com a introducció a les coordenades a l'espai, i a 1r de batxillerat tecnològic com a repàs lúdic del sistema dièdric.

## Per què un joc de batalla naval en 3D?

El joc clàssic ja és un exercici de coordenades en 2D. La versió 3D afegeix:

1. **Una tercera coordenada amb significat físic** (profunditat / altura), cosa que fa que l'alumne hagi de raonar sobre plans paral·lels i no només sobre una quadrícula.
2. **Restriccions per nivell** (submarins només sota l'aigua, atacs aeris només a la superfície), que obliguen a decidir quina arma i quin pla explorar: la mateixa pregunta que es fa en dibuix tècnic en triar una vista.
3. **Recursos limitats** (20 torpedes + 6 atacs aeris per a 500 cel·les), que converteixen la partida en un problema d'optimització i probabilitat.

## Connexió curricular (Decret 175/2022, Catalunya)

### Matemàtiques
| Sabers | Com apareix al joc |
|---|---|
| Coordenades cartesianes a l'espai | Cada tret és un punt (x, y, z); el visor mostra els eixos i etiquetes. |
| Distància entre punts | La pantalla final calcula el "salt mitjà" entre trets; el tutorial té calculadora de distància euclidiana. |
| Plans, rectes i posicions relatives | Un vaixell és un segment sobre un pla z = k, paral·lel a un eix. |
| Recompte i probabilitat | 500 cel·les, 7 vaixells, 26 trets: quina probabilitat té un tret a l'atzar? |
| Resolució de problemes i estratègia | Patró de cerca (tauler d'escacs cada N columnes segons la longitud del vaixell). |

### Educació Visual, Plàstica i Audiovisual · Dibuix tècnic
| Sabers | Com apareix al joc |
|---|---|
| Sistema dièdric: planta, alçat, perfil | Component `DiedricViews`: les tres projeccions de la cel·la apuntada i dels impactes. |
| Perspectiva isomètrica | Els dos visors 3D fan servir càmera ortogràfica en posició isomètrica. |
| Lectura de plànols i vistes | Deduir la posició d'un vaixell a partir de dues vistes. |

### Competències transversals
Pensament estratègic, gestió de recursos, comunicació (partides locals a dos), autoregulació (anàlisi del propi patró d'atac).

## Els tres conceptes clau

1. **El punt a l'espai.** Sense les tres coordenades no hi ha objectiu. L'ordre importa: (3, 7, -2) ≠ (7, 3, -2).
2. **Projeccions ortogonals.** Cada vista perd una coordenada. Amb dues vistes es reconstrueix el punt. El joc ho mostra en viu al panell d'atac.
3. **Distàncies i patrons.** Un portaavions fa 5 cel·les: un patró que dispari cada 5 columnes el troba segur. Les fragates (3) i submarins (3) demanen un patró més dens.

## Seqüència didàctica proposada (3 sessions)

### Sessió 1 · Tutorial + partida contra l'ordinador (55')
- 10' Tutorial seccions 1-3 en parelles.
- 30' Partida en mode tutorial. Consigna: anotar a la llibreta cada tret com a punt i marcar-lo a una planta i un alçat dibuixats a mà.
- 15' Posada en comú: quin nivell Z han explorat menys? Per què?

### Sessió 2 · Partida local a dos + dièdric (55')
- 5' Recordatori de les vistes.
- 35' Partida en mode local (hot-seat). Abans de cada tret, el jugador ha de dir en veu alta la cel·la i en quina vista l'ha deduïda.
- 15' Fitxa: donada la planta i l'alçat d'una flota, escriu les coordenades de tots els vaixells.

### Sessió 3 · Anàlisi i estratègia (55')
- 20' Amb la pantalla de resultats: precisió, columnes explorades, nivells usats, patró. Cada alumne redacta 3 línies sobre què canviaria.
- 25' Repte: dissenyar el patró de cerca mínim que garanteixi trobar un portaavions a z = 0. Comprovar-ho jugant.
- 10' Rànquing de la classe (`/api/scores`) i reflexió sobre la relació precisió / estratègia.

## Avaluació

- **Evidències automàtiques**: precisió, trets, vaixells enfonsats, nivells Z usats, patró (sistemàtic / exploratori / mixt), desats a Supabase per codi de classe.
- **Evidències manuals**: llibreta amb les vistes dièdriques, fitxa de coordenades, reflexió escrita.
- **Rúbrica suggerida** (4 nivells): llegeix coordenades / usa les tres coordenades correctament / dedueix posicions amb dues vistes / dissenya i justifica un patró de cerca.

## Adaptacions

- **NESE / reforç**: mode tutorial sense límit de partides; permetre mirar les vistes dièdriques sempre; començar amb Z fixat a 0.
- **Ampliació**: calcular la probabilitat d'encert del primer tret; demostrar per què el patró "cada 5 columnes" és òptim per a segments de longitud 5; estendre el joc a un grid de 12 × 12 × 7 canviant `lib/config.ts`.

## Referències

- Decret 175/2022, d'ordenació dels ensenyaments de l'educació bàsica (Catalunya).
- Catàleg d'apps educatives aulaia.cat, on Undirlaflota es relaciona amb MatEscac (escacs 3D) i Diedric3D.
