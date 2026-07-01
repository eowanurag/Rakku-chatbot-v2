import { ChatSessionState } from '../chat.service';
import { ChatRenderResult } from '../renderer/renderer.types';

export function renderReview(
  state: ChatSessionState,
  localizationService: any,
  calculateReadiness: (state: ChatSessionState, fields: string[]) => { valid: boolean; checklist: string }
): ChatRenderResult {
  const lang = state.language;
  const header = localizationService.translate('REVIEW_SCREEN_HEADER', lang);
  const labelValidationStatus = localizationService.translate('REVIEW_VALIDATION_STATUS', lang);
  
  let submitPrompt = lang === 'hi' ? 'क्या आप इस आवेदन को जमा करना चाहते हैं?' : (lang === 'hinglish' ? 'Kya aap ye application submit karna chahte hain?' : 'Would you like to submit this application?');
  let submitLabel = lang === 'hi' ? 'आवेदन सबमिट करें' : (lang === 'hinglish' ? 'Application submit karein' : 'Submit Application');
  let modifyLabel = lang === 'hi' ? 'विवरण बदलें' : (lang === 'hinglish' ? 'Details modify karein' : 'Modify Details');

  if (state.workflow === 'complaint') {
    if (!state.data.type) {
      return {
        text: 'Invalid review state: missing complaint type',
        buttons: [],
        metadata: { success: false }
      };
    }
    const readiness = calculateReadiness(state, ['type', 'time', 'description']);
    let reviewScreen = `${header}\n\n`;
    reviewScreen += `**${localizationService.translate('REVIEW_APPLICANT_PROFILE', lang)}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_NAME', lang)}: **${state.citizen.fullName}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_MOBILE', lang)}: **${state.citizen.mobileNumber}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_LOCATION', lang)}: **${(state.citizen.city || state.citizen.district) ? localizationService.localizeLocation(state.citizen.city || state.citizen.district, lang) : (lang === 'hi' ? 'प्रदान नहीं किया गया' : 'Not provided')}**\n`;
    reviewScreen += `${localizationService.translate('REVIEW_SERVICE_TYPE', lang)}: **${state.data.type}**\n`;

    if (state.data.brand) {
      reviewScreen += `\n📱 **${localizationService.translate('REVIEW_DEVICE_INFORMATION', lang)}**\n`;
      reviewScreen += `Brand: **${state.data.brand}**\n`;
      if (state.data.model) {
        reviewScreen += `Model: **${state.data.model}**\n`;
      }
      if (state.data.color) {
        reviewScreen += `Color: **${state.data.color}**\n`;
      }
      if (state.data.year) {
        reviewScreen += `Year: **${state.data.year}**\n`;
      }
      reviewScreen += `IMEI: **${state.data.imei || 'Not Provided'}**\n`;
    }

    reviewScreen += `\n**${localizationService.translate('REVIEW_INCIDENT_DETAILS', lang)}**\n`;
    reviewScreen += `Incident Location: **${state.data.location}**\n`;
    reviewScreen += `Incident Date: **${state.data.time}**\n`;
    reviewScreen += `Description: **${state.data.description}**\n\n`;

    reviewScreen += `**${labelValidationStatus}**\n\n${readiness.checklist}\n\n`;

    let sugs: string[];
    if (readiness.valid) {
      reviewScreen += `${submitPrompt}\n\n- [${submitLabel}](option:Submit Application)\n- [${modifyLabel}](option:Modify Details)`;
      sugs = [submitLabel, modifyLabel];
    } else {
      reviewScreen += `⚠️ **Cannot Submit:** Please complete all required fields.\n\n- [${modifyLabel}](option:Modify Details)`;
      sugs = [modifyLabel];
    }
    return {
      text: reviewScreen,
      buttons: sugs.map(text => ({ text, payload: text })),
      metadata: { readinessValid: readiness.valid }
    };
  } else if (state.workflow === 'verification') {
    const labelCandidateName = lang === 'hi' ? 'उम्मीदवार का नाम' : (lang === 'hinglish' ? 'Candidate Name' : 'Candidate Name');
    const labelCandidateMobile = lang === 'hi' ? 'उम्मीदवार का मोबाइल' : (lang === 'hinglish' ? 'Candidate Mobile' : 'Candidate Mobile');
    const labelCandidateAddress = lang === 'hi' ? 'उम्मीदवार का पता' : (lang === 'hinglish' ? 'Candidate Address' : 'Candidate Address');
    const labelPropertyDetails = lang === 'hi' ? 'संपत्ति का विवरण' : (lang === 'hinglish' ? 'Property Details' : 'Property Details');

    let checklist = `✓ ${lang === 'hi' ? 'सत्यापन विवरण पूर्ण' : 'Verification Details Complete'}\n✓ ${lang === 'hi' ? 'जमा करने के लिए तैयार' : 'Ready for Submission'}`;

    let reviewScreen = `${header}\n\n`;
    reviewScreen += `**${localizationService.translate('REVIEW_APPLICANT_PROFILE', lang)}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_NAME', lang)}: **${state.citizen.fullName}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_MOBILE', lang)}: **${state.citizen.mobileNumber}**\n`;
    reviewScreen += `${localizationService.translate('REVIEW_SERVICE_TYPE', lang)}: **${state.data.type}**\n\n`;

    reviewScreen += `**${localizationService.translate('REVIEW_CANDIDATE_DETAILS', lang)}**\n`;
    reviewScreen += `${labelCandidateName}: **${state.data.name}**\n`;
    reviewScreen += `${labelCandidateMobile}: **${state.data.mobile}**\n`;
    reviewScreen += `${labelCandidateAddress}: **${state.data.address}**\n`;
    reviewScreen += `${labelPropertyDetails}: **${state.data.propertyDetails}**\n\n`;

    reviewScreen += `**${labelValidationStatus}**\n\n${checklist}\n\n`;
    reviewScreen += `${submitPrompt}\n\n- [${submitLabel}](option:Submit Application)\n- [${modifyLabel}](option:Modify Details)`;

    return {
      text: reviewScreen,
      buttons: [
        { text: submitLabel, payload: submitLabel },
        { text: modifyLabel, payload: modifyLabel }
      ],
      metadata: { readinessValid: true }
    };
  } else if (state.workflow === 'certificate') {
    const labelSubjectName = lang === 'hi' ? 'विषय का नाम' : (lang === 'hinglish' ? 'Subject Name' : 'Subject Name');
    const labelSubjectAddress = lang === 'hi' ? 'विषय का पता' : (lang === 'hinglish' ? 'Subject Address' : 'Subject Address');
    const labelDistrict = lang === 'hi' ? 'जिला' : (lang === 'hinglish' ? 'District' : 'District');
    const labelPurpose = lang === 'hi' ? 'उद्देश्य' : (lang === 'hinglish' ? 'Purpose' : 'Purpose');

    const sourceLabel = state.data.isSelf ? (lang === 'hi' ? 'स्वयं' : 'Self') : (lang === 'hi' ? 'अन्य' : 'Other');
    let checklist = `✓ ${lang === 'hi' ? 'चरित्र प्रमाण पत्र विवरण पूर्ण' : 'Character Certificate Details Complete'}\n✓ ${lang === 'hi' ? 'जमा करने के लिए तैयार' : 'Ready for Submission'}`;

    let reviewScreen = `${header}\n\n`;
    reviewScreen += `**${localizationService.translate('REVIEW_APPLICANT_PROFILE', lang)}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_NAME', lang)}: **${state.citizen.fullName}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_MOBILE', lang)}: **${state.citizen.mobileNumber}**\n\n`;

    reviewScreen += `**${localizationService.translate('REVIEW_CANDIDATE_DETAILS', lang)}**\n`;
    reviewScreen += `Subject Information Source: **${sourceLabel}**\n`;
    reviewScreen += `${labelSubjectName}: **${state.data.name}**\n`;
    reviewScreen += `${labelSubjectAddress}: **${state.data.address}**\n`;
    reviewScreen += `${labelDistrict}: **${state.data.district ? localizationService.localizeLocation(state.data.district, lang) : 'Not Provided'}**\n`;
    reviewScreen += `${labelPurpose}: **${state.data.purpose}**\n\n`;

    reviewScreen += `**${labelValidationStatus}**\n\n${checklist}\n\n`;
    reviewScreen += `${submitPrompt}\n\n- [${submitLabel}](option:Submit Application)\n- [${modifyLabel}](option:Modify Details)`;

    return {
      text: reviewScreen,
      buttons: [
        { text: submitLabel, payload: submitLabel },
        { text: modifyLabel, payload: modifyLabel }
      ],
      metadata: { readinessValid: true }
    };
  } else if (state.workflow === 'event') {
    const labelOrganizerName = lang === 'hi' ? 'आयोजक का नाम' : (lang === 'hinglish' ? 'Organizer Name' : 'Organizer Name');
    const labelOrganizerAddress = lang === 'hi' ? 'आयोजक का पता' : (lang === 'hinglish' ? 'Organizer Address' : 'Organizer Address');
    const labelOrganizerMobile = lang === 'hi' ? 'आयोजक का मोबाइल' : (lang === 'hinglish' ? 'Organizer Mobile' : 'Organizer Mobile');
    const labelEventName = lang === 'hi' ? 'कार्यक्रम का नाम' : (lang === 'hinglish' ? 'Event Name' : 'Event Name');
    const labelLocation = lang === 'hi' ? 'स्थान' : (lang === 'hinglish' ? 'Location' : 'Location');
    const labelDate = lang === 'hi' ? 'तारीख' : (lang === 'hinglish' ? 'Date' : 'Date');
    const labelAttendance = lang === 'hi' ? 'अपेक्षित उपस्थिति' : (lang === 'hinglish' ? 'Expected Attendance' : 'Expected Attendance');

    const sourceLabel = state.data.isSelf ? (lang === 'hi' ? 'स्वयं' : 'Self') : (lang === 'hi' ? 'अन्य' : 'Other');
    let checklist = `✓ ${lang === 'hi' ? 'कार्यक्रम/प्रदर्शन विवरण पूर्ण' : 'Event/Performance Details Complete'}\n✓ ${lang === 'hi' ? 'जमा करने के लिए तैयार' : 'Ready for Submission'}`;

    let reviewScreen = `${header}\n\n`;
    reviewScreen += `**${localizationService.translate('REVIEW_APPLICANT_PROFILE', lang)}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_NAME', lang)}: **${state.citizen.fullName}**\n`;
    reviewScreen += `${localizationService.translate('PROFILE_MOBILE', lang)}: **${state.citizen.mobileNumber}**\n\n`;

    reviewScreen += `**Organizer Information Source: ${sourceLabel}**\n`;
    reviewScreen += `${labelOrganizerName}: **${state.data.organizerName || state.citizen.fullName}**\n`;
    reviewScreen += `${labelOrganizerAddress}: **${state.data.organizerAddress || state.citizen.addressLine1}**\n`;
    reviewScreen += `${labelOrganizerMobile}: **${state.data.organizerMobile || state.citizen.mobileNumber}**\n\n`;

    reviewScreen += `**${localizationService.translate('REVIEW_SERVICE_TYPE', lang)}**\n`;
    reviewScreen += `${labelEventName}: **${state.data.name}**\n`;
    reviewScreen += `${labelLocation}: **${state.data.location}**\n`;
    reviewScreen += `${labelDate}: **${state.data.date}**\n`;
    reviewScreen += `${labelAttendance}: **${state.data.attendance}**\n\n`;

    reviewScreen += `**${labelValidationStatus}**\n\n${checklist}\n\n`;
    reviewScreen += `${submitPrompt}\n\n- [${submitLabel}](option:Submit Application)\n- [${modifyLabel}](option:Modify Details)`;

    return {
      text: reviewScreen,
      buttons: [
        { text: submitLabel, payload: submitLabel },
        { text: modifyLabel, payload: modifyLabel }
      ],
      metadata: { readinessValid: true }
    };
  }

  return { text: 'Invalid step' };
}
