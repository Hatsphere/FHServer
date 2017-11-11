var firestore = require('./firestoreHelper');

/**
* Function to create the seller information on the server
* with the uid and data sent as parameters
*/
var createSellerInfo = function (uid, data, callback) {
    const ref = firestore.doc('seller/registered/' + uid + '/Info');
    console.log('Data received: ', data);
    ref.set({
        Name: data.Name,
        PlanChosen: data.PlanChosen,
        Address: data.Address,
        ContactNo: data.ContactNo,
        profileImage: ''
    }).then(() => {
        console.log('Seller Info updated: ' + uid);
        callback(200);
    }).catch((error) => {
        console.error(error);
        callback(500);
    });
};

/**
 * Function to fetch the seller information from the uid
 * and send as a response to the request
 */
var getSellerInfo = function (uid, callback) {
    const ref = firestore.doc('seller/registered/' + uid + '/Info');
    ref.get().then(doc => {
        const result = doc.data();
        console.log('Results received: ', result);
        callback(null, result);
    }).catch(error => {
        callback(error);
    });
};

/**
 * Function to update the profile Image property in the seller
 * registered document reference
 */
var updateProfileImage = function(uid, link, callback) {
    const ref = firestore.doc('seller/registered/' + uid + '/Info');
    ref.update({
        profileImage: link
    }).then(() => {
        console.log('Profile Image added');
    }).catch(err => {
        console.error(err);
        callback(err);
    });
};

module.exports = {
    writeSellerInfo: createSellerInfo,
    getSellerInfo: getSellerInfo,
    updateProfile: updateProfileImage
};

