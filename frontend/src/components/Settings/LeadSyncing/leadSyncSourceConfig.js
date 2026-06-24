import LogoFacebook from '@/components/Icons/FacebookIcon.vue'
import LogoIndiaMART from '@/components/Icons/IndiaMARTIcon.vue'

export const supportedSourceTypes = [
  {
    label: 'Facebook',
    value: 'Facebook',
    icon: LogoFacebook,
    info: __(
      'You will need a Meta developer account and an access token to sync leads from Facebook. Read more',
    ),
    link: 'https://www.facebook.com/business/help/503306463479099?id=2190812977867143',
    custom: false,
  },
  {
    label: 'IndiaMART',
    value: 'IndiaMART',
    icon: LogoIndiaMART,
    info: __(
      'You will need an IndiaMART Pull API key (glusr_crm_key) to sync leads. Generate it at seller.indiamart.com/leadmanager/crmapi',
    ),
    link: 'https://seller.indiamart.com/leadmanager/crmapi',
    custom: false,
  },
]

export const sourceIcon = {
  Facebook: LogoFacebook,
  IndiaMART: LogoIndiaMART,
}

export const fbSourceFields = [
  {
    name: 'name',
    label: __('Name'),
    type: 'text',
    placeholder: __('Add a name for your source'),
  },
  {
    name: 'access_token',
    label: __('Access Token'),
    type: 'password',
    placeholder: __('Enter your Facebook Access Token'),
  },
]
