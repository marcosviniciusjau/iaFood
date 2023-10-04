import { useState } from "react"
import { Image, ScrollView, Text, View } from "react-native"
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { styles } from "./styles"
import { api } from "../../services/api";
import { foodContains } from '../../utils/foodContains'
import { Tip } from "../../components/Tip"
import { Item, ItemProps } from "../../components/Item"
import { Button } from "../../components/Button"
import { Alert } from "react-native";
import { Loading } from "../../components/Loading";

export function Home() {
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [isLoading, setIsLoading]= useState(false);
  const [items,setItems]= useState<ItemProps[]>([]);
  const [message,setMessage]= useState('');

  async function handleSelectImage() {
    try{
     const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

     if(status !== ImagePicker.PermissionStatus.GRANTED){
      return Alert.alert("É necessário permissão para acessar seu álbum")
     }
     setIsLoading(true);
     const response= await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing:true,
      aspect:[4,4],
      quality:1
     });

     if(response.canceled){
      return setIsLoading(false);
     }

     if(!response.canceled){
      const imgManipulated= await ImageManipulator.manipulateAsync(
        response.assets[0].uri,
        [{resize:{ width:900 } }],
        {
          compress:1,
          format:ImageManipulator.SaveFormat.JPEG,
          base64:true
        }
      );
      setSelectedImageUri(imgManipulated.uri);
      foodDetected(imgManipulated.base64);
     }
    }catch(error){
      console.log(error)
    }
  }

  async function foodDetected(imageBase64: string | undefined) {
    try {
      const response = await api.post(
        `/v2/models/${process.env.EXPO_PUBLIC_API_MODEL_ID}/versions/${process.env.EXPO_PUBLIC_API_MODEL_VERSION_ID}/outputs`,
        {
          user_app_id: {
            user_id: process.env.EXPO_PUBLIC_API_USER_ID,
            app_id: process.env.EXPO_PUBLIC_API_APP_ID,
          },
          inputs: [
            {
              data: {
                image: {
                  base64: imageBase64,
                },
              },
            },
          ],
        }
      )
      const concepts=response.data.outputs[0].data.concepts.map((concept: any)=>{
        return{
          name: concept.name,
          percentage: `${Math.round(concept.value * 100)}%`
        }
      });
      const isVegetable= foodContains(concepts, 'vegetable');
      setMessage(isVegetable ? 'Parabéns por ter adicionado vegetais!': 'Adicione vegetais em seu prato!');
      setItems(concepts)
      setIsLoading(false);

    } catch (error) {
      console.error("Erro na solicitação:", error)
    }
    
  }

  return (
    <View style={styles.container}>
      <Button onPress={handleSelectImage} disabled={isLoading} />

      {selectedImageUri ? (
        <Image
          source={{ uri: selectedImageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.description}>
          Selecione a foto do seu prato para analizar.
        </Text>
      )}

      <View style={styles.bottom}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {message && (
              <Tip
                message={message}
              />
            )}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 24 }}
            >
              <View style={styles.items}>
                {items.map((item) => (
                  <Item key={item.name} data={item} />
                ))}
              </View>
            </ScrollView>
          </>
        )}
      </View>
    </View>
  )
}
