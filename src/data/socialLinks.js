import { FacebookIcon, InstagramIcon, LinkedinIcon, WhatsappIcon } from '../components/ui/SocialIcons'

// Shared between Header and Footer so both stay in sync. Real profile links,
// taken directly from the footer of https://argroup.az.
export const socialLinks = [
  { Icon: FacebookIcon, href: 'https://www.facebook.com/argroup.az', label: 'Facebook' },
  { Icon: InstagramIcon, href: 'https://www.instagram.com/argroupcs', label: 'Instagram' },
  { Icon: LinkedinIcon, href: 'https://www.linkedin.com/in/ar-group-construction-services-432b8621b', label: 'LinkedIn' },
  {
    Icon: WhatsappIcon,
    href: 'https://api.whatsapp.com/send/?phone=%2B994552778424&text&type=phone_number&app_absent=0',
    label: 'WhatsApp',
  },
]
