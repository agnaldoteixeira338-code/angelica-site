/* ==========================================================================
   Configuração pública do site.

   Só o Cloudinary (fotos) fica aqui, porque é seguro expor — o "preset"
   é restrito e não dá acesso a nada sensível. O banco de dados e a senha
   ficam do lado do servidor (Netlify + Neon), nunca neste arquivo.
   Veja o passo a passo em NEON.md.
   ========================================================================== */

const cloudinaryConfig = {
  cloudName: "uaqmbard",
  uploadPreset: "Angelica",
};
