import { db, auth } from '../config/firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

export const addItemsToFirestore = async (items) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData || !userData.groups || userData.groups.length === 0) {
      throw new Error('User has no associated group');
    }

    const groupId = userData.groups[0];
    const groupRef = doc(db, 'groups', groupId);
    const itemsCollectionRef = collection(groupRef, 'items');

    const addedItems = [];

    for (const item of items) {
      const newItemRef = doc(itemsCollectionRef);
      await setDoc(newItemRef, {
        name: item.name,
        price: item.price,
        properties: {
          isFood: item.isFood,
          goesInFridge: item.goesInFridge,
          foodCategory: item.foodCategory,
          ripenessIndicators: item.ripenessIndicators,
          canBeLeftOut: item.canBeLeftOut,
          expirationRefrigerated: item.expirationRefrigerated,
          expirationRoomTemp: item.expirationRoomTemp,
          isInFridge: item.goesInFridge,
          expiryNotificationOffset: 2,
          alertStatus: 'active',
          isCustomExpiry: 'No',
          daysToExpiry: calculateDaysToExpiry(item.expirationRefrigerated, item.expirationRoomTemp, item.goesInFridge),
        },
        lists: ['food'],
        status: 'active',
        dateAdded: new Date().toISOString(),
        dateModified: new Date().toISOString(),
      });
      addedItems.push({ id: newItemRef.id, ...item });
    }

    return addedItems;
  } catch (error) {
    console.error('Error adding items to Firestore:', error);
    throw error;
  }
};

export const getFoodItems = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData || !userData.groups || userData.groups.length === 0) {
      throw new Error('User has no associated group');
    }

    const groupId = userData.groups[0];
    const groupRef = doc(db, 'groups', groupId);
    const itemsCollectionRef = collection(groupRef, 'items');
    const itemsQuery = query(itemsCollectionRef, where('status', '==', 'active'));

    const querySnapshot = await getDocs(itemsQuery);
    const foodItems = [];
    querySnapshot.forEach((doc) => {
      foodItems.push({ id: doc.id, ...doc.data() });
    });

    return foodItems;
  } catch (error) {
    console.error('Error getting food items:', error);
    throw error;
  }
};

export const updateFoodItem = async (itemId, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData || !userData.groups || userData.groups.length === 0) {
      throw new Error('User has no associated group');
    }

    const groupId = userData.groups[0];
    const itemRef = doc(db, 'groups', groupId, 'items', itemId);
    await updateDoc(itemRef, {
      ...updatedData,
      dateModified: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    throw error;
  }
};

export const deleteFoodItem = async (itemId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData || !userData.groups || userData.groups.length === 0) {
      throw new Error('User has no associated group');
    }

    const groupId = userData.groups[0];
    const itemRef = doc(db, 'groups', groupId, 'items', itemId);
    await updateDoc(itemRef, {
      status: 'deleted',
      dateModified: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting food item:', error);
    throw error;
  }
};

const calculateDaysToExpiry = (expirationRefrigerated, expirationRoomTemp, goesInFridge) => {
  const today = new Date();
  const expirationDate = new Date(goesInFridge === 'Yes' ? expirationRefrigerated : expirationRoomTemp);
  const diffTime = Math.abs(expirationDate - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays}d`;
};