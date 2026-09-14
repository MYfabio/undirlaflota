# Models 3D (.glb)

Descarregats de Sketchfab (llicència CC Attribution: cal citar l'autor, veure `/about`).

| Fitxer | Model | Autor | Font |
|---|---|---|---|
| carrier.glb | USS Nimitz class aircraft carrier | Larcenie Grant | https://sketchfab.com/3d-models/uss-nimitz-class-aircraft-carrier-e9f23bab3bd14f34ba9e54ccd082f46d |
| frigate.glb | TYPE-23 CLASS FRIGATE | Muhamad Mirza Arrafi | https://sketchfab.com/3d-models/type-23-class-frigate-630e1ca50133477f855ce6422a3763b9 |
| submarine.glb | Kilo Class Submarine | Art Blender | https://sketchfab.com/3d-models/kilo-class-submarine-b7b2b557ebfa422b961d44b546369b08 |
| fighter.glb | Low poly SU-57 | SIpriv | https://sketchfab.com/3d-models/low-poly-su-57-b9031bc2e94947b18812ce0eca6b8345 |
| bomber.glb | Lowpoly B52 Stratofortress | SIpriv | https://sketchfab.com/3d-models/lowpoly-b52-stratofortress-b1236b165402436b92afae6a65fe3e27 |
| explosion.glb | Explosion (malla estàtica, usada per als enfonsaments) | andersdt | https://sketchfab.com/3d-models/explosion-46fb54741fbc4cc0854c03b5ef5d0624 |

S'activen amb la variable d'entorn:

    NEXT_PUBLIC_AVAILABLE_MODELS=carrier.glb,frigate.glb,submarine.glb,fighter.glb,bomber.glb,explosion.glb

Sense la variable, el joc dibuixa unitats procedimentals. Els fitxers es serveixen amb cache immutable (next.config.ts).
