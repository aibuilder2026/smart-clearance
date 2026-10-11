// How a person is recognised when they type who they are: an email address, or an Indian mobile number with or
// without +91 and spaces (the prototype's sign-in rules, screens/auth.jsx). The rule is the contract's, in
// @smart-clearance/api (SC-169: core depends on api, never the other way), shared from here as before.
export { isEmail, digits, phoneOf } from '@smart-clearance/api/identity';
