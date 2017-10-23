const Firestore = require('@google-cloud/firestore');

const firestore = new Firestore({
    projectId: 'testapp-932ba',
    keyFilename: './TestApp-bc5766f47e99.json'
});

var createSellerInfo = function(uid, data, callback) {
    const ref = firestore.doc('seller/registered/' + uid + '/Info');
    console.log('Data received: ', data);
    ref.set({
        'Name': data.Name,
        'PlanChosen': data.PlanChosen,
        'Address': data.Address,
        'ContactNo': data.ContactNo
    }).then(() => {
        console.log('Seller Info updated: ' + uid);
        callback(200);
    }).catch((error) => {
        console.error(error);
        callback(500);
    });
};

module.exports = {
    writeSellerInfo: createSellerInfo
};

