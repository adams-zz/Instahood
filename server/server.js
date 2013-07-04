Meteor.methods({
    getAccessToken: function(){
        try{
            return Meteor.user().profile.token;
        } catch (e){
            throw (e);
        }
    }
})

// Accounts.loginServiceConfiguration.remove({
//     service: "instagram"
// });

// Accounts.loginServiceConfiguration.insert({
//     service: "instagram",
//     clientId: "4e7f292665474f8fae3820d7f336f164",
//     secret: "de2499764644447286f414b2d692061a",
//     scope: "basic"
// });