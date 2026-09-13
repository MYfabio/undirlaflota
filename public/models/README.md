# Models 3D (.glb)

Descarrega els models (format glTF binari) i desa'ls aqui amb aquests noms:

| Fitxer | Font suggerida |
|---|---|
| carrier.glb | https://sketchfab.com/3d-models/uss-nimitz-class-aircraft-carrier-e9f23bab3bd14f34ba9e54ccd082f46d |
| frigate.glb | https://sketchfab.com/3d-models/type-23-class-frigate-630e1ca50133477f855ce6422a3763b9 |
| submarine.glb | https://sketchfab.com/3d-models/kilo-class-submarine-b7b2b557ebfa422b961d44b546369b08 |
| fighter.glb | Sketchfab: "fighter jet free" (CC-BY) |
| bomber.glb | Sketchfab: "bomber aircraft free" (CC-BY) |

Sketchfab requereix compte per descarregar. Comprova la llicencia (CC-BY: cita l'autor a app/about).
Recomanacio: < 2 MB per model (usa gltf-transform o Blender per simplificar).

Despres, activa'ls amb la variable d'entorn:

    NEXT_PUBLIC_AVAILABLE_MODELS=carrier.glb,frigate.glb,submarine.glb

Sense la variable, el joc dibuixa vaixells procedimentals.
