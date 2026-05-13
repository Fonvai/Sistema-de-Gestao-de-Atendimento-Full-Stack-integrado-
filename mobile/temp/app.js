// ============================================================
//  SISTEMA DE GESTÃO DE ATENDIMENTO — APP MOBILE (React Native)
//  Arquivo: mobile/App.js
//
//  O QUE ESTE ARQUIVO FAZ:
//  - Tela inicial para o usuário abrir um chamado
//  - Captura foto com a câmera do celular
//  - Captura localização GPS
//  - Envia os dados para o backend Node.js
//
//  COMO RODAR:
//  1. npx create-expo-app mobile --template blank
//  2. Copie este arquivo para substituir o App.js gerado
//  3. npm install @react-navigation/native @react-navigation/native-stack
//     expo install expo-camera expo-location expo-image-picker
//  4. npx expo start
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location  from 'expo-location';
import { NavigationContainer }       from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ⚠️ Ajuste este IP para o seu computador quando usar um dispositivo físico.
// Para emulador Android use 10.0.2.2, para iOS simulator use localhost.
const LOCAL_API_HOST = '192.168.1.100';
const API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3001'
  : `http://${LOCAL_API_HOST}:3001`;

const Stack = createNativeStackNavigator();

// ============================================================
//  TELA 1: Abrir Chamado
// ============================================================
function AbrirChamadoScreen({ navigation }) {
  // Estados do formulário
  const [titulo,    setTitulo]    = useState('');
  const [descricao, setDescricao] = useState('');
  const [usuario,   setUsuario]   = useState('');
  const [foto,      setFoto]      = useState(null);      // URI local da foto
  const [localizacao, setLocalizacao] = useState(null);  // { lat, lng }
  const [carregando, setCarregando]   = useState(false);
  const [pegandoLocalizacao, setPegandoLocalizacao] = useState(false);

  // --- Função: Tirar foto ---
  const tirarFoto = async () => {
    // Pede permissão para usar a câmera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acessar sua câmera para tirar fotos.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,             // 70% de qualidade para não pesar demais
    });

    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  };

  // --- Função: Pegar localização GPS ---
  const pegarLocalizacao = async () => {
    setPegandoLocalizacao(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos acessar sua localização.');
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setLocalizacao({
        lat: posicao.coords.latitude,
        lng: posicao.coords.longitude
      });
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível obter a localização.');
    } finally {
      setPegandoLocalizacao(false);
    }
  };

  // --- Função: Enviar chamado para o backend ---
  const enviarChamado = async () => {
    // Validação simples
    if (!titulo.trim() || !descricao.trim() || !usuario.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha: título, descrição e seu nome.');
      return;
    }

    setCarregando(true);

    try {
      // FormData permite enviar texto + arquivo (foto) juntos
      const formData = new FormData();
      formData.append('titulo',   titulo);
      formData.append('descricao', descricao);
      formData.append('usuario',  usuario);

      if (localizacao) {
        formData.append('lat', String(localizacao.lat));
        formData.append('lng', String(localizacao.lng));
      }

      if (foto) {
        // Determina a extensão da foto
        const extensao = foto.split('.').pop();
        formData.append('foto', {
          uri:  foto,
          name: `foto_chamado.${extensao}`,
          type: `image/${extensao}`
        });
      }

      const resposta = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        body:   formData
      });

      if (!resposta.ok) throw new Error('Erro ao enviar chamado');

      const ticket = await resposta.json();

      Alert.alert(
        '✅ Chamado aberto!',
        `Seu chamado #${ticket.id} foi registrado.\nAguarde nossa equipe.`,
        [{ text: 'OK', onPress: () => navigation.navigate('MeusChamados') }]
      );

      // Limpa o formulário
      setTitulo(''); setDescricao(''); setUsuario('');
      setFoto(null); setLocalizacao(null);

    } catch (erro) {
      Alert.alert('Erro', `Não foi possível enviar: ${erro.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={estilos.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloPagina}>🛠️ Abrir Chamado</Text>
        <Text style={estilos.subtitulo}>Descreva seu problema para nossa equipe</Text>
      </View>

      {/* Campo: Nome do usuário */}
      <Text style={estilos.label}>Seu nome *</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ex: João Silva"
        value={usuario}
        onChangeText={setUsuario}
      />

      {/* Campo: Título */}
      <Text style={estilos.label}>Título do problema *</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ex: Computador não liga"
        value={titulo}
        onChangeText={setTitulo}
      />

      {/* Campo: Descrição */}
      <Text style={estilos.label}>Descrição detalhada *</Text>
      <TextInput
        style={[estilos.input, estilos.inputMultiline]}
        placeholder="Descreva o problema com detalhes. Ex: O computador travou depois de uma atualização do Windows..."
        value={descricao}
        onChangeText={setDescricao}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {/* Botão: Tirar foto */}
      <TouchableOpacity style={estilos.botaoSecundario} onPress={tirarFoto}>
        <Text style={estilos.textoBotaoSecundario}>
          {foto ? '📷 Trocar foto' : '📷 Tirar foto do problema'}
        </Text>
      </TouchableOpacity>
      {foto && (
        <Image source={{ uri: foto }} style={estilos.preview} resizeMode="cover" />
      )}

      {/* Botão: Pegar localização */}
      <TouchableOpacity
        style={estilos.botaoSecundario}
        onPress={pegarLocalizacao}
        disabled={pegandoLocalizacao}
      >
        {pegandoLocalizacao ? (
          <ActivityIndicator color="#2980B9" />
        ) : (
          <Text style={estilos.textoBotaoSecundario}>
            {localizacao
              ? `📍 Local: ${localizacao.lat.toFixed(4)}, ${localizacao.lng.toFixed(4)}`
              : '📍 Adicionar localização'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Botão: Enviar */}
      <TouchableOpacity
        style={[estilos.botaoPrincipal, carregando && estilos.botaoDesabilitado]}
        onPress={enviarChamado}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={estilos.textoBotaoPrincipal}>Abrir Chamado →</Text>
        )}
      </TouchableOpacity>

      {/* Link para ver chamados */}
      <TouchableOpacity onPress={() => navigation.navigate('MeusChamados')}>
        <Text style={estilos.link}>Ver meus chamados</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============================================================
//  TELA 2: Meus Chamados
// ============================================================
function MeusChamadosScreen() {
  const [tickets, setTickets]     = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Carrega os tickets ao abrir a tela
  useEffect(() => {
    buscarTickets();
  }, []);

  const buscarTickets = async () => {
    try {
      const resposta = await fetch(`${API_URL}/tickets`);
      const dados    = await resposta.json();
      setTickets(dados.reverse()); // mais recentes primeiro
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar os chamados.');
    } finally {
      setCarregando(false);
    }
  };

  // Cor do badge de status
  const corStatus = {
    aberto:        '#E74C3C',
    em_andamento:  '#F39C12',
    resolvido:     '#27AE60',
    cancelado:     '#95A5A6'
  };

  if (carregando) {
    return (
      <View style={estilos.centralized}>
        <ActivityIndicator size="large" color="#2980B9" />
        <Text>Carregando chamados...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.container}>
      <TouchableOpacity style={estilos.botaoAtualizar} onPress={buscarTickets}>
        <Text style={estilos.textoBotaoSecundario}>🔄 Atualizar</Text>
      </TouchableOpacity>

      {tickets.length === 0 ? (
        <Text style={estilos.semDados}>Nenhum chamado encontrado.</Text>
      ) : (
        tickets.map(ticket => (
          <View key={ticket.id} style={estilos.card}>
            <View style={estilos.cardCabecalho}>
              <Text style={estilos.cardId}>#{ticket.id}</Text>
              <View style={[estilos.badge, { backgroundColor: corStatus[ticket.status] || '#999' }]}>
                <Text style={estilos.badgeTexto}>{ticket.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={estilos.cardTitulo}>{ticket.titulo}</Text>
            <Text style={estilos.cardDescricao} numberOfLines={2}>{ticket.descricao}</Text>
            <View style={estilos.cardRodape}>
              <Text style={estilos.cardMeta}>🏷️ {ticket.categoria}</Text>
              <Text style={estilos.cardMeta}>⚡ {ticket.prioridade}</Text>
              <Text style={estilos.cardMeta}>👤 {ticket.usuario}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ============================================================
//  COMPONENTE RAIZ — Navegação entre telas
// ============================================================
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AbrirChamado"
        screenOptions={{
          headerStyle:     { backgroundColor: '#2C3E50' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen
          name="AbrirChamado"
          component={AbrirChamadoScreen}
          options={{ title: 'Sistema de Atendimento' }}
        />
        <Stack.Screen
          name="MeusChamados"
          component={MeusChamadosScreen}
          options={{ title: 'Meus Chamados' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================
//  ESTILOS
// ============================================================
const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    padding: 16
  },
  cabecalho: {
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center'
  },
  tituloPagina: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  subtitulo:    { fontSize: 13, color: '#BDC3C7', marginTop: 4 },
  label:        { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDE3EC'
  },
  inputMultiline: { height: 110 },
  botaoPrincipal: {
    backgroundColor: '#2980B9',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 10
  },
  botaoDesabilitado: { backgroundColor: '#95A5A6' },
  textoBotaoPrincipal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  botaoSecundario: {
    borderWidth: 1.5,
    borderColor: '#2980B9',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  textoBotaoSecundario: { color: '#2980B9', fontSize: 14, fontWeight: '600' },
  botaoAtualizar: {
    borderWidth: 1.5, borderColor: '#2980B9', borderRadius: 10,
    padding: 10, alignItems: 'center', marginBottom: 14
  },
  preview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  link: { textAlign: 'center', color: '#2980B9', marginTop: 16, textDecorationLine: 'underline' },
  centralized: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  semDados: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  cardCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardId:        { fontSize: 12, color: '#999', fontWeight: '600' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { color: '#FFF', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardTitulo:    { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  cardDescricao: { fontSize: 13, color: '#7F8C8D', marginBottom: 8 },
  cardRodape:    { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  cardMeta:      { fontSize: 12, color: '#95A5A6' }
});