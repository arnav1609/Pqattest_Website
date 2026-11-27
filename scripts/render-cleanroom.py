"""Render the two poses of the conceptual cleanroom with Blender."""
import bpy, math
from mathutils import Vector
from pathlib import Path
b=bpy
b.ops.wm.read_factory_settings(use_empty=True)
def mat(name,c,metal=0):
 m=b.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.32
 return m
white=mat('Ceramic',(.72,.76,.75)); suit=mat('Woven coverall',(.78,.8,.77)); steel=mat('Brushed steel',(.32,.37,.39),.7); dark=mat('Graphite',(.035,.047,.06)); blue=mat('Status blue',(.05,.32,.85)); glass=mat('Smoked visor',(.04,.11,.16),.6); gold=mat('Metal contact',(.6,.46,.26),.7)
def shape(name,pos,size,m,round=False):
 if round:b.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=pos)
 else:b.ops.mesh.primitive_cube_add(size=2,location=pos)
 o=b.context.object;o.name=name;o.scale=size;b.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if round:b.ops.object.shade_smooth()
 else:
  mod=o.modifiers.new('Edge radius','BEVEL');mod.width=min(.045,min(size)*.4);mod.segments=3;o.modifiers.new('Face normals','WEIGHTED_NORMAL')
 return o
def limb(a,z,r):
 v=Vector(z)-Vector(a);o=shape('Coverall',Vector(a)+v/2,(r,r,v.length/2+.08),suit,True);o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
for x in range(-5,6):
 for y in range(-3,7):shape('Floor panel',(x*1.2,y*1.2,-.05),(.594,.594,.04),steel)
for x in range(-4,5):
 shape('Wall panel',(x*1.35,5,2),(.67,.08,2),white)
 shape('Ceiling strip',(x*1.35,2,3.96),(.045,3,.035),white)
for x in [-4,-2,0,2,4]:
 shape('Equipment cabinet',(x,3.8,1.25),(.94,.7,1.25),white);shape('Service window',(x,3.08,1.65),(.77,.03,.48),glass)
 for j in range(8):shape('Vent',(x-.62+j*.17,3.08,.48),(.045,.03,.18),steel)
shape('Lithography tool',(1,1.3,1.35),(1.25,.76,1.35),white);shape('Inspection bay',(1,.52,1.55),(1.02,.045,.65),dark);shape('Optics',(1,.38,1.94),(.26,.2,.24),steel);shape('Wafer',(1,.25,1.25),(.63,.28,.035),gold,True)
shape('Bench',(1,-1.1,.85),(1.6,.63,.09),steel)
for x in [-.45,2.45]:shape('Bench leg',(x,-1.1,.4),(.07,.46,.4),steel)
shape('Carrier',(1,-1.1,.99),(.72,.5,.045),white);shape('Package',(1,-1.1,1.09),(.4,.33,.06),dark)
for i in range(12):
 for s in [-1,1]:shape('Lead',(.64+i*.065,-1.1+s*.35,1.065),(.017,.06,.019),gold)
x=-1.25
for dx in [-.16,.16]:
 limb((x+dx,0,.23),(x+dx,0,1.13),.16);shape('Boot',(x+dx,-.07,.14),(.18,.26,.14),white,True)
shape('Coverall',(x,0,1.43),(.39,.26,.58),suit,True)
limb((x-.32,0,1.72),(x-.43,-.08,1.12),.13);limb((x+.28,0,1.73),(x+.58,-.09,1.48),.14);limb((x+.58,-.09,1.48),(x+.92,.06,1.64),.11)
shape('Glove',(x+.94,.06,1.65),(.14,.09,.085),white,True)
# Instrument markings, wafer stage, service hardware and suit details.
def lettering(value, pos, rotation, size, material):
 b.ops.object.text_add(location=pos,rotation=rotation)
 obj=b.context.object;obj.data.body=value;obj.data.size=size;obj.data.align_x='CENTER';obj.data.materials.append(material)
lettering('PQ-ATTEST',(1,-1.1,1.152),(0,0,0),.085,white)
lettering('EXPOSURE  /  03',(1,.485,2.39),(math.pi/2,0,0),.09,dark)
for i in range(3):
 shape('Optical barrel',(1,.36,1.83-i*.14),(.19-i*.028,.14-i*.018,.08),steel,True)
shape('Stage pedestal',(1,.33,1.08),(.44,.27,.1),steel)
for j in range(-5,6):
 width=.56*(1-(j/6)**2)**.5
 shape('Wafer scribe',(1,.25+j*.041,1.285),(width,.002,.001),steel)
shape('Operator console',(2.13,.42,1.52),(.19,.07,.26),steel)
shape('Display',(2.13,.34,1.56),(.15,.012,.17),glass)
for j in range(4):shape('Display row',(2.11,.322,1.64-j*.047),(.09-j*.014,.004,.005),blue)
for j in range(3):shape('Tower light',(2.11,.91,2.78+j*.07),(.055,.055,.035),blue if j==2 else glass,True)
shape('Coverall closure',(x,-.252,1.48),(.012,.012,.38),steel)
shape('Chest patch',(x+.14,-.231,1.59),(.071,.017,.042),white)
shape('Left glove',(x-.43,-.085,1.08),(.103,.095,.145),white,True)
pivot=b.data.objects.new('Engineer head',None);b.context.collection.objects.link(pivot);pivot.location=(x,0,2.08)
for name,p,sz,m in [('Hood',(0,0,0),(.274,.254,.325),suit),('Goggles',(0,-.219,.045),(.23,.07,.104),glass),('Mask',(0,-.217,-.105),(.19,.07,.107),white)]:
 o=shape(name,p,sz,m,True);o.parent=pivot
scene=b.context.scene;scene.world=b.data.worlds.new('Ambient');scene.world.color=(.42,.45,.49)
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
for p,power,size in [((-3,-4,5),720,5),((4,1,4),630,4),((0,4,4),450,4)]:
 b.ops.object.light_add(type='AREA',location=p);o=b.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;aim(o,(0,0,1))
b.ops.object.camera_add(location=(2.25,-6.5,2.65));cam=b.context.object;aim(cam,(0,.55,1.45));cam.data.lens=36;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=1080;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=85
for name,angle in [('room',1.05),('welcome',.35)]:
 pivot.rotation_euler.z=angle;scene.render.filepath=str(Path(__file__).resolve().parents[1]/'src/assets'/f'{name}.webp');b.ops.render.render(write_still=True)
