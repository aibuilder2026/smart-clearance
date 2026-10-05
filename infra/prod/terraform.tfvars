project_id      = "aibuilder-510213"
region          = "asia-south1"
billing_account = "012B20-D65DBD-FBAC0E"

# Keyed by the targets in frontend/firebase.json. Add custom_domain = "smartclearance.com" (and
# "console.smartclearance.com") once the domain is registered.
hosting_sites = {
  site = {
    site_id = "smartclearance"
  }
  console = {
    site_id = "smartclearance-console"
  }
}
