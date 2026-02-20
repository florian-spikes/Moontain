
export const getEmailHtml = (
  type: string,
  doc: { number: string; formattedDate: string; total_amount: number; public_url: string; client: { name: string, manager_civility?: string, manager_first_name?: string, manager_last_name?: string } }
) => {
  const amount = doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const docLabel = doc.number || 'Brouillon';
  const dateLabel = doc.formattedDate || '—';

  // Construct greeting
  let greeting = `Bonjour ${doc.client.name},`;
  if (doc.client.manager_civility && doc.client.manager_last_name) {
    greeting = `Chère Madame ${doc.client.manager_last_name},`;
    if (doc.client.manager_civility === 'Monsieur') {
      greeting = `Cher Monsieur ${doc.client.manager_last_name},`;
    }
  }

  // Content based on type
  let title = '';
  let message = '';
  let buttonLabel = 'Télécharger le document';

  switch (type) {
    case 'quote':
      title = `Votre devis Moontain.studio ${docLabel} du ${dateLabel} est disponible`;
      message = `<p>${greeting}</p>
        <p>Vous trouverez ci-joint votre devis <strong>${docLabel}</strong> du ${dateLabel} sous forme de fichier PDF.</p>
        <br>
        <p>Numéro de devis :<br><strong>${docLabel}</strong></p>
        <br>
        <p>Montant du devis :<br><strong>${amount}</strong></p>
        <p>Nous restons à votre disposition pour toute question.</p>`;
      buttonLabel = 'Voir le devis';
      break;
    case 'invoice':
      title = `Votre facture Moontain.studio ${docLabel} du ${dateLabel} est disponible`;
      message = `<p>${greeting}</p>
        <p>Vous trouverez ci-joint votre facture <strong>${docLabel}</strong> du ${dateLabel} sous forme de fichier PDF.</p>
        <br>
        <p>Numéro de facture :<br><strong>${docLabel}</strong></p>
        <br>
        <p>Montant de la facture :<br><strong>${amount}</strong></p>`;
      buttonLabel = 'Voir la facture';
      break;
    case 'reminder':
      title = `Rappel : Facture ${docLabel}`;
      message = `<p>${greeting}</p>
        <p>Sauf erreur de notre part, la facture <strong>${docLabel}</strong> d'un montant de <strong>${amount}</strong> est en attente de règlement.</p>
        <p>Merci de procéder au paiement dès que possible.</p>`;
      buttonLabel = 'Voir la facture';
      break;
    case 'resend':
      title = `Copie du document ${docLabel}`;
      message = `<p>${greeting}</p>
        <p>Comme demandé, voici une copie de votre document.</p>`;
      break;
  }

  // HTML Template
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#F8F0E8; font-family: Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8F0E8; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
             <h1 style="margin: 0; font-size: 24px; color: #000000; letter-spacing: -0.5px;">MOONTAIN.STUDIO</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px; font-size: 16px; line-height: 1.6; color: #333333;">
              <h2 style="margin-top: 0; margin-bottom: 20px; font-size: 20px; color: #000000;">${title}</h2>
              ${message}
              
              <!-- Button -->
              <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                <a href="${doc.public_url}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">${buttonLabel}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0;">Moontain Studio<br>Paris, France</p>
              <p style="margin: 0;">Ce message a été envoyé automatiquement.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
