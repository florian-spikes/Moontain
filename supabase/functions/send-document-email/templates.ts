
export const getEmailTemplate = (
  type: string,
  doc: { type: string, number: string; formattedDate: string; total_amount: number; public_url: string; client: { name: string, manager_civility?: string, manager_first_name?: string, manager_last_name?: string } }
): { subject: string, html: string } => {
  const amount = doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const docLabel = doc.number || 'Brouillon';
  const dateLabel = doc.formattedDate || '—';
  const tel = "+33 6 40 40 03 89"; // Replace with actual if we have one

  // Construct greeting (Prenom or fallback to Name)
  let prenom = doc.client.manager_first_name || doc.client.name;
  let hasFormalGreeting = false;

  let greeting = `Bonjour ${prenom},`;
  if (doc.client.manager_civility && doc.client.manager_last_name) {
    greeting = `Chère Madame ${doc.client.manager_last_name},`;
    if (doc.client.manager_civility === 'Monsieur') {
      greeting = `Cher Monsieur ${doc.client.manager_last_name},`;
    }
    hasFormalGreeting = true;
  }

  // Content based on type
  let subject = '';
  let title = '';
  let message = '';
  let buttonLabel = 'Consulter le document';

  switch (type) {
    case 'quote':
      subject = `Votre devis Moontain.studio ${docLabel} du ${dateLabel} est disponible`;
      title = `Devis ${docLabel}`;
      message = `<p>${greeting}</p>
        <p>Vous trouverez ci-joint votre devis <strong>${docLabel}</strong> du ${dateLabel} sous forme de fichier PDF.</p>
        <br>
        <p>Montant du devis : <strong>${amount}</strong></p>
        <p>Nous restons à votre disposition pour toute question.</p>`;
      buttonLabel = 'Voir le devis';
      break;

    case 'invoice':
      subject = `Votre facture Moontain.studio ${docLabel} du ${dateLabel} est disponible`;
      title = `Facture ${docLabel}`;
      message = `<p>${greeting}</p>
        <p>Vous trouverez ci-joint votre facture <strong>${docLabel}</strong> du ${dateLabel} sous forme de fichier PDF.</p>
        <br>
        <p>Montant de la facture : <strong>${amount}</strong></p>`;
      buttonLabel = 'Voir la facture';
      break;

    case 'auto_reminder_J-15':
      subject = `Facture ${docLabel} – échéance à venir – Moontain.studio`;
      title = `Rappel préventif`;
      message = `<p>${greeting}</p>
        <p>Petit rappel de la part de l’équipe Moontain.studio : la facture <strong>${docLabel}</strong> arrive bientôt à échéance.</p>
        <br>
        <p>Si besoin d’une précision ou d’un complément, notre équipe reste disponible.</p>
        <p>Bien à vous,<br>L’équipe Moontain.studio</p>`;
      buttonLabel = 'Consulter la facture';
      break;

    case 'auto_reminder_J-7':
      subject = `Rappel – Facture ${docLabel} – Moontain.studio`;
      title = `Rappel d'échéance`;
      message = `<p>${greeting}</p>
        <p>Rappel de la part de Moontain.studio : la facture <strong>${docLabel}</strong> arrive prochainement à échéance.</p>
        <br>
        <p>Si le règlement est déjà en cours, vous pouvez ignorer ce message.<br>Merci d’avance,<br>L’équipe Moontain.studio</p>`;
      buttonLabel = 'Consulter la facture';
      break;

    case 'auto_reminder_J-1':
      subject = `Dernier rappel avant échéance – Facture ${docLabel} – Moontain.studio`;
      title = `Dernier rappel avant échéance`;
      message = `<p>${greeting}</p>
        <p>Dernier rappel avant échéance concernant la facture <strong>${docLabel}</strong>.</p>
        <br>
        <p>En cas de question ou si une information manque pour finaliser le règlement, notre équipe est disponible.</p>
        <p>Cordialement,<br>L’équipe Moontain.studio</p>`;
      buttonLabel = 'Consulter la facture';
      break;

    case 'auto_reminder_J+3':
    case 'reminder': // Fallback manuelle (on utilise J+3 by default pour un "retard")
      subject = `Relance – Facture ${docLabel} en retard – Moontain.studio`;
      title = `Facture en retard`;
      message = `<p>${greeting}</p>
        <p>Sauf erreur, la facture <strong>${docLabel}</strong> émise par Moontain.studio n’a pas encore été réglée et est désormais en retard.</p>
        <p>Merci de procéder au paiement dès que possible, ou de nous confirmer une date de règlement.</p>
        <br>
        <p>Dans l’attente de votre retour,<br>L’équipe Moontain.studio<br>${tel}</p>`;
      buttonLabel = 'Consulter la facture';
      break;

    case 'auto_reminder_J+10':
      subject = `Relance finale – Facture ${docLabel} – Moontain.studio`;
      title = `Relance finale`;
      message = `<p>${greeting}</p>
        <p>Malgré nos relances, la facture <strong>${docLabel}</strong> émise par Moontain.studio reste impayée à ce jour.</p>
        <p><strong>Merci de régulariser la situation sous 48h ou de nous confirmer immédiatement une date de paiement.</strong></p>
        <br>
        <p>À défaut de règlement ou de retour, les services associés (hébergement/maintenance) pourront être suspendus jusqu’à régularisation.</p>
        <p>Cordialement,<br>L’équipe Moontain.studio<br>${tel}</p>`;
      buttonLabel = 'Consulter la facture';
      break;

    case 'auto_reminder_quote_J+3':
      subject = `Devis ${docLabel} – avez-vous pu le consulter ? – Moontain.studio`;
      title = `Suivi de devis`;
      message = `<p>${greeting}</p>
        <p>Nous revenons vers vous au sujet du devis <strong>${docLabel}</strong> envoyé par Moontain.studio. Avez-vous eu le temps de le consulter ?</p>
        <br>
        <p>Si besoin, nous pouvons ajuster un point (périmètre, délais, options) pour coller au mieux à votre besoin.</p>
        <p>Bien à vous,<br>L’équipe Moontain.studio<br>${tel}</p>`;
      buttonLabel = 'Consulter le devis';
      break;

    case 'auto_reminder_quote_J+10':
      subject = `Devis ${docLabel} – on se cale 10 minutes ? – Moontain.studio`;
      title = `Suivi de devis`;
      message = `<p>${greeting}</p>
        <p>Nous relançons au sujet du devis <strong>${docLabel}</strong> envoyé par Moontain.studio.</p>
        <p>Si c’est plus simple, nous pouvons caler un court appel (10 minutes) pour valider les derniers points et lancer le projet rapidement.</p>
        <br>
        <p>Dites-nous ce qui vous arrange le mieux :</p>
        <ul>
          <li>Mardi 18h</li>
          <li>Vendredi 14h</li>
        </ul>
        <br>
        <p>Bien à vous,<br>L’équipe Moontain.studio</p>`;
      buttonLabel = 'Consulter le devis';
      break;

    case 'resend':
    default:
      subject = `Copie : ${doc.type === 'quote' ? 'Devis' : 'Facture'} Moontain.studio ${docLabel}`;
      title = `Copie du document ${docLabel}`;
      message = `<p>${greeting}</p>
        <p>Comme demandé, voici une copie de votre document.</p>`;
      break;
  }

  // HTML Template
  const html = `
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

  return { subject, html };
}
