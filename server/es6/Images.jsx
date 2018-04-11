class Images {
    baseURL = '/images/';
    get BANNER_LARGE()                  { return this.baseURL + 'banner-large.png';                 }
    get BANNER_SMALL()                  { return this.baseURL + 'banner-small.png';                 }
    get BV_TEXT()                       { return this.baseURL + 'BVtext.png';                       }
    get BV_TEXT_SMALL()                 { return this.baseURL + 'BVtext.png';                       }
    get LOGO_LARGE()                    { return this.baseURL + 'logo-large.png';                   }
    get LOGO_SMALL()                    { return this.baseURL + 'transparent_sml_logo.png';         }
    get BUSINESS_TRANSACTION()          { return this.baseURL + 'business-transaction-id.png';      }
    get BUSINESS_TRANSACTION_DISABLED() { return this.baseURL + 'business-transaction-id-grey.png'; }
    get BUSINESS_TRANSACTION_SEARCH()   { return this.baseURL + 'business-transaction-search.png';  }
    get TRANSACTION()                   { return this.baseURL + 'transaction-id.png';               }
    get TRANSACTION_DISABLED()          { return this.baseURL + 'transaction-id-grey.png';          }
    get PAYLOAD_FILE()                  { return this.baseURL + 'payload-file.png';                 }
    get VERIFY_PROCESSING()             { return this.baseURL + 'verify-progressing.png';           }
    get VERIFY_SUCCEDED()               { return this.baseURL + 'verify-succeded.png';              }
    get VERIFY_FAILED()                 { return this.baseURL + 'verify-failed.png';                }
    get DOWN_ARROW()                    { return this.baseURL + 'down-arrow.svg';                   }
    get EVENT_BADGE()                   { return this.baseURL + 'event-badge.svg';                  }
    get EVENT()                         { return this.baseURL + 'event.svg';                        }
    get DISPUTE_NO_IMAGE()              { return this.baseURL + 'dispute-num-badge.png'; }
    get DISPUTE_NO_TRANSACTION_IMAGE()  { return this.baseURL + 'dispute-num-badge.png'; }
    get DISPUTE_TRANSACTION_CONTAINER_IMAGE() { return this.baseURL + 'dispute-transation-container.png'; }
    get DISPUTE_PARTICIPANT_BADGE()     { return this.baseURL + 'disputes-user-badge.svg';          }
    get EVENT_BADGE_ORANGE()            { return this.baseURL + 'event-badge-orange.svg';           }
    get DISPUTE_PARTICIPANT_BADGE_ORANGE()     { return this.baseURL + 'disputes-user-badge-orange.svg';  }
}

const images = new Images()
export default images;